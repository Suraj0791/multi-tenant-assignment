// Role-based access control middleware
const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

// Role hierarchy for permission inheritance
const roleHierarchy = {
  admin: ['admin', 'manager', 'member'],
  manager: ['manager', 'member'],
  member: ['member']
};

// Permission-based access control middleware
const hasPermission = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoleHierarchy = roleHierarchy[req.user.role] || [];
    if (!userRoleHierarchy.includes(requiredRole)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

// Task-specific permission middleware
const canModifyTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.canBeModifiedByUser(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Attach task to request for later use
    req.task = task;
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export { roleAuth, hasPermission, canModifyTask };

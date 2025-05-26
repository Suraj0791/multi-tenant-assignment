import Organization from "../models/Organization.js";

// Middleware to ensure user belongs to the organization
export const ensureOrganizationAccess = async (req, res, next) => {
  try {
    if (!req.user || !req.user.organization) {
      return res
        .status(403)
        .json({ error: "User must belong to an organization" });
    }

    const organization = await Organization.findOne({
      _id: req.user.organization,
      isActive: true,
    });

    if (!organization) {
      return res
        .status(403)
        .json({ error: "Organization not found or inactive" });
    }

    req.organization = organization;
    next();
  } catch (error) {
    res.status(500).json({ error: "Error checking organization access" });
  }
};

// Middleware to check if user has admin access to organization
export const ensureAdminAccess = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Error checking admin access" });
  }
};

// Middleware to check if user has manager or admin access
export const ensureManagerAccess = async (req, res, next) => {
  try {
    if (!req.user || !["admin", "manager"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Manager or admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Error checking manager access" });
  }
};

// Middleware to ensure data belongs to user's organization
export const ensureOrganizationData = (Model) => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findOne({
        _id: req.params.id,
        organization: req.user.organization,
      });

      if (!resource) {
        return res
          .status(404)
          .json({ error: "Resource not found or access denied" });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ error: "Error checking resource access" });
    }
  };
};

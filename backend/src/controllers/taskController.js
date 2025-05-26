import Task from '../models/Task.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import {
  sendTaskAssignmentNotification,
  sendTaskReminderNotification,
  sendStatusUpdateNotification
} from '../utils/email.js';

// Valid status transitions
const STATUS_TRANSITIONS = {
  todo: ['in_progress'],
  in_progress: ['completed', 'todo'],
  completed: ['in_progress'],
  expired: ['in_progress']
};

// Create new task
export const createTask = async (req, res) => {
  console.log("Received task creation request with body:", req.body);
  try {
    const { title, description, assignedTo, category, priority, dueDate } = req.body;

    // Validate category against organization settings
    const organization = await Organization.findById(req.organizationId);
    if (!organization.settings.taskCategories.includes(category)) {
      console.log("Invalid category:", category);
      return res.status(400).json({ error: 'Invalid category for this organization' });
    }

    // Validate assignees exist and are in the organization
    if (assignedTo && assignedTo.length > 0) {
      const assignees = await User.find({
        _id: { $in: assignedTo },
        organization: req.organizationId
      });

      if (assignees.length !== assignedTo.length) {
        return res.status(400).json({ error: 'One or more assigned users are invalid' });
      }
    }

    const task = new Task({
      title,
      description,
      organization: req.organizationId,
      assignedTo: assignedTo || [],
      createdBy: req.user._id,
      category,
      priority,
      dueDate
    });

    // Add initial assignment history
    if (assignedTo && assignedTo.length > 0) {
      task.assignmentHistory = assignedTo.map(userId => ({
        user: userId,
        assignedBy: req.user._id
      }));
    }

    await task.save();

    // Send notifications to all assignees
    if (assignedTo && assignedTo.length > 0) {
      const assignees = await User.find({ _id: { $in: assignedTo } });
      for (const assignee of assignees) {
        await sendTaskAssignmentNotification(assignee.email, {
          taskTitle: task.title,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          category: task.category
        });
      }
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all tasks for organization
export const getTasks = async (req, res) => {
  try {
    const { status, category, priority, assignedTo, search, dateRange, isExpired } = req.query;
    
    const query = { organization: req.organizationId };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    
    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateRange) {
      const [start, end] = dateRange.split(',');
      query.dueDate = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    // Expired tasks filter
    if (isExpired === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'completed' };
    }

    // If user is a member, only show assigned tasks
    if (req.user.role === 'member') {
      query.assignedTo = req.user._id;
    }

    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'email firstName lastName')
      .populate('createdBy', 'email firstName lastName')
      .populate('statusHistory.changedBy', 'email firstName lastName')
      .populate('assignmentHistory.user', 'email firstName lastName')
      .populate('assignmentHistory.assignedBy', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get single task
export const getTask = async (req, res) => {
  try {
    console.log("Searching for task with ID:", req.params.id);
    const task = await Task.findOne({
      _id: req.params.id,
      organization: req.organizationId
    })
    .populate('assignedTo', 'email firstName lastName')
    .populate('createdBy', 'email firstName lastName');

    console.log("Task findOne result:", task);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if member has access to this task
    if (req.user.role === 'member' && 
        task.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;

    // Validate status
    if (!['todo', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      organization: req.organizationId
    }).populate('assignedTo');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is assigned to this task
    if (!task.isAssignedToUser(req.user._id) && req.user.role === 'member') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if status transition is valid
    if (!STATUS_TRANSITIONS[task.status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from ${task.status} to ${status}`
      });
    }

    // Set user context for status history
    task.setUserContext(req.user);

    // Update status
    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
      task.completedBy = req.user._id;
    }

    // Add status history entry
    task.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      comment: comment || `Status changed to ${status}`
    });

    await task.save();

    // Notify other assignees about the status change
    const otherAssignees = task.assignedTo.filter(
      assignee => assignee._id.toString() !== req.user._id.toString()
    );

    const updatedBy = `${req.user.firstName} ${req.user.lastName}`;

    for (const assignee of otherAssignees) {
      await sendStatusUpdateNotification(
        assignee.email,
        {
          taskTitle: task.title,
          dueDate: task.dueDate,
          newStatus: status
        },
        updatedBy,
        comment
      );
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'description', 'assignedTo', 'category', 'priority', 'dueDate'];
    // Status updates should use the dedicated updateTaskStatus endpoint
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Set user context for status history
    task.setUserContext(req.user);

    // Check if user can modify this task
    if (!task.canBeModifiedByUser(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldAssignees = [...task.assignedTo];
    const oldStatus = task.status;

    // Apply updates
    updates.forEach(update => task[update] = req.body[update]);
    await task.save();

    // Handle notifications for status changes
    if (task.status !== oldStatus) {
      const notifyUsers = new Set([...oldAssignees, ...task.assignedTo]);
      const updatedBy = `${req.user.firstName} ${req.user.lastName}`;

      for (const userId of notifyUsers) {
        const user = await User.findById(userId);
        if (user) {
          await sendStatusUpdateNotification(
            user.email,
            {
              taskTitle: task.title,
              dueDate: task.dueDate,
              newStatus: task.status
            },
            updatedBy,
            req.body.statusComment
          );
        }
      }
    }

    // Handle notifications for new assignees
    if (req.body.assignedTo) {
      const newAssignees = req.body.assignedTo.filter(
        id => !oldAssignees.includes(id)
      );

      for (const assigneeId of newAssignees) {
        const assignee = await User.findById(assigneeId);
        if (assignee) {
          await sendTaskAssignmentNotification(assignee.email, {
            taskTitle: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            category: task.category
          });
        }
      }
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only managers and admins can delete tasks
    if (req.user.role === 'member') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await task.remove();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

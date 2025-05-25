import Task from '../models/Task.js';
import { sendTaskNotification } from '../utils/email.js';

// Create new task
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, category, priority, dueDate } = req.body;

    const task = new Task({
      title,
      description,
      organization: req.organizationId,
      assignedTo,
      createdBy: req.user._id,
      category,
      priority,
      dueDate
    });

    await task.save();

    // If task is assigned, send notification
    if (assignedTo) {
      await sendTaskNotification(
        task.assignedTo.email,
        task.title,
        task.dueDate
      );
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all tasks for organization
export const getTasks = async (req, res) => {
  try {
    const { status, category, priority, assignedTo } = req.query;
    
    const query = { organization: req.organizationId };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    // If user is a member, only show assigned tasks
    if (req.user.role === 'member') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'email firstName lastName')
      .populate('createdBy', 'email firstName lastName')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get single task
export const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      organization: req.organizationId
    })
    .populate('assignedTo', 'email firstName lastName')
    .populate('createdBy', 'email firstName lastName');

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

// Update task
export const updateTask = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'description', 'assignedTo', 'status', 'category', 'priority', 'dueDate'];
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

    // Check permissions
    if (req.user.role === 'member' && 
        task.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Apply updates
    updates.forEach(update => task[update] = req.body[update]);
    await task.save();

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

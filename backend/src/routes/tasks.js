import express from 'express';
import { 
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask
} from '../controllers/taskController.js';
import { auth } from '../middleware/auth.js';
import { roleAuth, hasPermission, canModifyTask } from '../middleware/roleAuth.js';
import Task from '../models/Task.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get task stats
router.get('/stats', hasPermission('member'), async (req, res) => {
  try {
    const query = { organization: req.organizationId };
    
    // If member, only show assigned tasks
    if (req.user.role === 'member') {
      query.assignedTo = req.user._id;
    }

    const [totalTasks, completedTasks, expiredTasks, overdueNotExpired] = await Promise.all([
      Task.countDocuments(query),
      Task.countDocuments({ ...query, status: 'completed' }),
      Task.countDocuments({ ...query, status: 'expired' }),
      Task.countDocuments({
        ...query,
        status: { $nin: ['completed', 'expired'] },
        dueDate: { $lt: new Date() }
      })
    ]);

    // Get task distribution by category
    const categoryStats = await Task.aggregate([
      { $match: query },
      { $group: {
        _id: '$category',
        count: { $sum: 1 }
      }}
    ]);

    // Get task distribution by priority
    const priorityStats = await Task.aggregate([
      { $match: query },
      { $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }}
    ]);

    res.json({
      overview: {
        totalTasks,
        completedTasks,
        expiredTasks,
        overdueNotExpired,
        pendingTasks: totalTasks - completedTasks - expiredTasks
      },
      distribution: {
        byCategory: categoryStats,
        byPriority: priorityStats
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent tasks
router.get('/recent', hasPermission('member'), async (req, res) => {
  try {
    const query = { organization: req.organizationId };
    
    // If member, only show assigned tasks
    if (req.user.role === 'member') {
      query.assignedTo = req.user._id;
    }

    const recentTasks = await Task.find(query)
      .populate('assignedTo', 'email firstName lastName')
      .populate('createdBy', 'email firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json(recentTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task activity
router.get('/activity', hasPermission('member'), async (req, res) => {
  try {
    const query = { organization: req.organizationId };
    
    // If member, only show assigned tasks
    if (req.user.role === 'member') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('statusHistory.changedBy', 'email firstName lastName')
      .populate('assignmentHistory.user', 'email firstName lastName')
      .populate('assignmentHistory.assignedBy', 'email firstName lastName')
      .sort({ 'statusHistory.changedAt': -1, 'assignmentHistory.assignedAt': -1 })
      .limit(10);

    const activity = [];

    // Combine and sort status and assignment history
    tasks.forEach(task => {
      task.statusHistory.forEach(status => {
        activity.push({
          type: 'status',
          taskId: task._id,
          taskTitle: task.title,
          status: status.status,
          changedBy: status.changedBy,
          timestamp: status.changedAt,
          comment: status.comment
        });
      });

      task.assignmentHistory.forEach(assignment => {
        activity.push({
          type: 'assignment',
          taskId: task._id,
          taskTitle: task.title,
          assignee: assignment.user,
          assignedBy: assignment.assignedBy,
          timestamp: assignment.assignedAt
        });
      });
    });

    // Sort by timestamp descending
    activity.sort((a, b) => b.timestamp - a.timestamp);

    res.json(activity.slice(0, 20));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks
router.get('/', hasPermission('member'), getTasks);

// Create new task
router.post('/', hasPermission('manager'), createTask);

// Get single task
router.get('/:id', hasPermission('member'), getTask);

// Update task
router.patch('/:id', hasPermission('member'), canModifyTask, updateTask);

// Delete task
router.delete('/:id', roleAuth('admin', 'manager'), deleteTask);

// Bulk update tasks
router.patch('/bulk/update', roleAuth('admin', 'manager'), async (req, res) => {
  try {
    const { taskIds, updates } = req.body;

    // Validate update fields
    const allowedUpdates = ['status', 'priority', 'category', 'dueDate', 'assignedTo'];
    const isValidOperation = Object.keys(updates)
      .every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const tasks = await Task.find({
      _id: { $in: taskIds },
      organization: req.organizationId
    });

    // Update each task
    for (const task of tasks) {
      task.setUserContext(req.user);
      Object.keys(updates).forEach(update => {
        task[update] = updates[update];
      });
      await task.save();
    }

    res.json({ message: `Updated ${tasks.length} tasks` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk delete tasks
router.delete('/bulk/delete', roleAuth('admin'), async (req, res) => {
  try {
    const { taskIds } = req.body;

    const result = await Task.deleteMany({
      _id: { $in: taskIds },
      organization: req.organizationId
    });

    res.json({ message: `Deleted ${result.deletedCount} tasks` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

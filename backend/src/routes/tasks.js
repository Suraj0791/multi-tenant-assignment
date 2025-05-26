import express from 'express';
import { 
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask
} from '../controllers/taskController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get task stats
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      teamMembers: 0
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent tasks
router.get('/recent', async (req, res) => {
  try {
    // Return empty array for now
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks
router.get('/', getTasks);

// Create new task
router.post('/', authorize('admin', 'manager'), createTask);

// Get single task
router.get('/:id', getTask);

// Update task
router.patch('/:id', updateTask);

// Delete task
router.delete('/:id', authorize('admin', 'manager'), deleteTask);

export default router;

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

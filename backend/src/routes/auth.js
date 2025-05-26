import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Debug route
router.get('/debug', (req, res) => {
  res.json({ message: 'Auth routes are working' });
});

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, getProfile);

export default router;

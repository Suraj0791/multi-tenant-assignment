import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cron from 'node-cron';
import { checkTaskExpiry } from './utils/taskExpiry.js';

// Import routes
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import organizationRoutes from './routes/organizations.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/organizations', organizationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Schedule task expiry check (runs every hour)
  cron.schedule('0 * * * *', async () => {
    console.log('Running task expiry check...');
    await checkTaskExpiry();
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Multi-tenant Task Management API',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

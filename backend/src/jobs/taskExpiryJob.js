import cron from 'node-cron';
import Task from '../models/Task.js';
import { sendTaskExpiryNotification } from '../utils/email.js';

// Run every hour to check for expired tasks
const taskExpiryJob = cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running task expiry check...');

    const now = new Date();
    
    // Find tasks that are:
    // 1. Due date has passed
    // 2. Not already marked as expired or completed
    const expiredTasks = await Task.find({
      dueDate: { $lt: now },
      status: { $nin: ['expired', 'completed'] }
    }).populate('assignedTo');

    for (const task of expiredTasks) {
      // Set task as expired
      task.status = 'expired';
      task.statusHistory.push({
        status: 'expired',
        changedAt: now,
        comment: 'Task automatically marked as expired'
      });

      await task.save();

      // Notify assignees
      if (task.assignedTo && task.assignedTo.length > 0) {
        for (const assignee of task.assignedTo) {
          await sendTaskExpiryNotification(
            assignee.email,
            task.title,
            task.dueDate
          );
        }
      }
    }

    console.log(`Marked ${expiredTasks.length} tasks as expired`);
  } catch (error) {
    console.error('Error in task expiry job:', error);
  }
});

export default taskExpiryJob;

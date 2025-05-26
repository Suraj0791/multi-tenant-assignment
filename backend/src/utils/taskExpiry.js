import Task from '../models/Task.js';
import User from '../models/User.js';
import { sendTaskExpiryNotification, sendTaskReminderNotification } from './email.js';

// Check for tasks about to expire (24 hours before due date)
export const checkTaskReminders = async () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  try {
    // Find tasks due in the next 24 hours
    const tasks = await Task.find({
      dueDate: {
        $gt: now,
        $lt: tomorrow
      },
      status: { $nin: ['completed', 'expired'] }
    }).populate('assignedTo');

    // Send reminders for each task
    for (const task of tasks) {
      if (task.assignedTo && task.assignedTo.length > 0) {
        for (const assignee of task.assignedTo) {
          await sendTaskReminderNotification(assignee.email, {
            taskTitle: task.title,
            dueDate: task.dueDate,
            status: task.status
          });
        }
      }
    }

    console.log(`Sent reminders for ${tasks.length} tasks due in 24 hours`);
  } catch (error) {
    console.error('Task reminder check failed:', error);
  }
};

// Check for expired tasks
export const checkTaskExpiry = async () => {
  const now = new Date();
  
  try {
    // Find tasks that are due and not completed/expired
    const tasks = await Task.find({
      dueDate: { $lt: now },
      status: { $nin: ['completed', 'expired'] }
    }).populate('assignedTo');

    // Update tasks to expired status
    for (const task of tasks) {
      // Set task as expired
      task.status = 'expired';
      task.statusHistory.push({
        status: 'expired',
        changedAt: now,
        comment: 'Task automatically marked as expired'
      });

      await task.save();

      // Send notifications to assignees
      if (task.assignedTo && task.assignedTo.length > 0) {
        for (const assignee of task.assignedTo) {
          await sendTaskExpiryNotification(assignee.email, {
            taskTitle: task.title,
            dueDate: task.dueDate,
            status: 'expired'
          });
        }
      }
    }
    
    console.log(`Updated ${tasks.length} tasks to expired status`);
  } catch (error) {
    console.error('Task expiry check failed:', error);
  }
};

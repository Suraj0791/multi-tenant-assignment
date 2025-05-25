import Task from '../models/Task.js';
import { sendTaskNotification } from './email.js';

export const checkTaskExpiry = async () => {
  const now = new Date();
  
  try {
    // Find tasks that are due and not completed/expired
    const tasks = await Task.find({
      dueDate: { $lt: now },
      status: { $nin: ['completed', 'expired'] }
    }).populate('assignedTo');

    // Update tasks to expired status
    const updatePromises = tasks.map(async (task) => {
      task.status = 'expired';
      
      // Send notification if user is assigned
      if (task.assignedTo) {
        await sendTaskNotification(
          task.assignedTo.email,
          task.title,
          task.dueDate
        );
      }
      
      return task.save();
    });

    await Promise.all(updatePromises);
    
    console.log(`Updated ${tasks.length} tasks to expired status`);
  } catch (error) {
    console.error('Task expiry check failed:', error);
  }
};

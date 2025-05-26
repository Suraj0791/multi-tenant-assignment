import { Resend } from 'resend';
import { config } from '../config/index.js';

const resend = new Resend(config.resendApiKey);

export const sendInvitationEmail = async (email, organizationName, inviteLink) => {
  try {
    await resend.emails.send({
      from: 'Multi-Tenant Task Manager <onboarding@resend.dev>',
      to: email,
      subject: `Invitation to join ${organizationName}`,
      html: `
        <h1>You've been invited!</h1>
        <p>You have been invited to join ${organizationName} on our Task Management Platform.</p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteLink}">${inviteLink}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

const getEmailTemplate = (type, data) => {
  const templates = {
    taskAssignment: `
      <h1>New Task Assignment</h1>
      <p>You have been assigned a new task:</p>
      <h2>${data.taskTitle}</h2>
      <p><strong>Description:</strong> ${data.description || 'No description provided'}</p>
      <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
      <p><strong>Priority:</strong> ${data.priority}</p>
      <p><strong>Category:</strong> ${data.category}</p>
      <p>Please start working on this task at your earliest convenience.</p>
    `,
    taskReminder: `
      <h1>Task Reminder</h1>
      <p>Your task is due soon:</p>
      <h2>${data.taskTitle}</h2>
      <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
      <p><strong>Current Status:</strong> ${data.status}</p>
      <p>Please make sure to complete this task before the deadline.</p>
    `,
    taskExpiry: `
      <h1>Task Expired</h1>
      <p>The following task has passed its due date:</p>
      <h2>${data.taskTitle}</h2>
      <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
      <p><strong>Current Status:</strong> ${data.status}</p>
      <p>Please update the task status or contact your manager for assistance.</p>
    `,
    statusUpdate: `
      <h1>Task Status Update</h1>
      <p>A task you're involved with has been updated:</p>
      <h2>${data.taskTitle}</h2>
      <p><strong>New Status:</strong> ${data.newStatus}</p>
      <p><strong>Updated By:</strong> ${data.updatedBy}</p>
      ${data.comment ? `<p><strong>Comment:</strong> ${data.comment}</p>` : ''}
      <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
    `
  };

  return templates[type];
};

export const sendTaskNotification = async (email, type, data) => {
  try {
    const subjects = {
      taskAssignment: `New Task Assignment: ${data.taskTitle}`,
      taskReminder: `Task Reminder: ${data.taskTitle}`,
      taskExpiry: `Task Expired: ${data.taskTitle}`,
      statusUpdate: `Task Status Update: ${data.taskTitle}`
    };

    await resend.emails.send({
      from: 'Multi-Tenant Task Manager <notifications@resend.dev>',
      to: email,
      subject: subjects[type],
      html: getEmailTemplate(type, data)
    });

    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Shorthand functions for specific notifications
export const sendTaskAssignmentNotification = (email, task) => {
  return sendTaskNotification(email, 'taskAssignment', task);
};

export const sendTaskReminderNotification = (email, task) => {
  return sendTaskNotification(email, 'taskReminder', task);
};

export const sendTaskExpiryNotification = (email, task) => {
  return sendTaskNotification(email, 'taskExpiry', task);
};

export const sendStatusUpdateNotification = (email, task, updatedBy, comment) => {
  return sendTaskNotification(email, 'statusUpdate', {
    ...task,
    updatedBy,
    comment
  });
};

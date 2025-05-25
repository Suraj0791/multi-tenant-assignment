import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendInvitationEmail = async (email, organizationName, inviteLink) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
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

export const sendTaskNotification = async (email, taskTitle, dueDate) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: `Task Reminder: ${taskTitle}`,
      html: `
        <h1>Task Reminder</h1>
        <p>Your task "${taskTitle}" is due on ${new Date(dueDate).toLocaleDateString()}.</p>
        <p>Please complete it before the deadline.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

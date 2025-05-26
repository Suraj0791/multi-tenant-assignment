import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { sendInvitationEmail } from '../utils/email.js';
import crypto from 'crypto';
import { config } from '../config/index.js';

// Get organization details
export const getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(organization);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update organization
export const updateOrganization = async (req, res) => {
  try {
    // Only admin can update organization
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'settings'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    updates.forEach(update => {
      if (update === 'settings') {
        organization.settings = { ...organization.settings, ...req.body.settings };
      } else {
        organization[update] = req.body[update];
      }
    });

    await organization.save();
    res.json(organization);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get organization members
export const getMembers = async (req, res) => {
  try {
    const users = await User.find({ organization: req.organizationId })
      .select('-password')
      .sort({ role: 1, firstName: 1 });
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Invite new member
export const inviteMember = async (req, res) => {
  console.log('--- INVITE MEMBER CONTROLLER CALLED --- Body:', req.body, 'User:', req.user ? req.user.email : 'No user', 'OrgID:', req.organizationId);
  try {
    // Only admin and manager can invite
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { email, role } = req.body;

    // Validate role
    if (!['member', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    console.log('--- INVITE MEMBER: Checking if user exists with email:', email, '---');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('--- INVITE MEMBER: User already exists with email:', email, 'User ID:', existingUser._id, '---');
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    console.log('--- INVITE MEMBER: Attempting to find organization with ID:', req.organizationId, '---');
    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      console.error('--- INVITE MEMBER: Organization not found for ID:', req.organizationId, '---');
      return res.status(404).json({ error: 'Organization not found. Cannot send invite.' });
    }
    console.log('--- INVITE MEMBER: Organization found:', organization.name, 'ID:', organization._id, '---');

    // Create invite link
    const inviteLink = `${config.frontendUrl}/join/${inviteToken}`;

    // Store invitation in memory (should be stored in database in production)
    // For this demo, we'll just send the email
    console.log('--- INVITE MEMBER: FRONTEND_URL is:', process.env.FRONTEND_URL, '---');
    console.log('--- INVITE MEMBER: Invite link generated:', inviteLink, '---');
    console.log('--- INVITE MEMBER: Attempting to send email to:', email, 'Org Name:', organization.name, '---');
    const emailSent = await sendInvitationEmail(email, organization.name, inviteLink);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send invitation email. Please check server logs.' });
    }

    console.log('--- INVITE MEMBER: Email sent successfully to:', email, '---');
    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('--- INVITE MEMBER: CAUGHT ERROR ---', error.name, error.message, error.stack); // Add server-side logging
    res.status(400).json({ error: error.message });
  }
};

// Update member role
export const updateMemberRole = async (req, res) => {
  console.log('--- updateMemberRole controller CALLED ---', 'Params:', req.params, 'Body:', req.body);
  try {
    // Only admin can update roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { userId } = req.params; // Get userId from route parameters
    const { role } = req.body; // Get role from request body

    // Validate role
    if (!['member', 'manager', 'admin'].includes(role)) { // Allow 'admin' role to be set
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findOne({
      _id: userId,
      organization: req.organizationId
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in this organization' }); // More specific error
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot change own role' });
    }

    user.role = role;
    await user.save();

    res.json(user);
  } catch (error) {
    console.error('Error in updateMemberRole:', error); // Add server-side logging
    res.status(400).json({ error: error.message || 'Failed to update role' });
  }
};

// Remove member
// Verify invitation token
export const verifyInvite = async (req, res) => {
  const { inviteToken } = req.params;
  
  try {
    // Here you would typically:
    // 1. Find the invitation in your database using the token
    // 2. Check if it's expired
    // 3. Return the organization and role information
    
    // For now, we'll use a simple in-memory approach since you're storing invites in memory
    // You should implement proper database storage for invitations in production
    
    // Mock response for now - replace with actual DB lookup
    res.json({
      email: req.query.email, // The email address from the invitation
      organizationName: "Your Organization", // Get this from your DB
      role: "member" // The role they were invited as
    });
  } catch (error) {
    console.error('Error in verifyInvite:', error);
    res.status(400).json({ error: 'Invalid or expired invitation' });
  }
};

// Accept invitation
export const acceptInvite = async (req, res) => {
  const { inviteToken } = req.params;
  
  try {
    // Here you would typically:
    // 1. Verify the token again
    // 2. Add the user to the organization with the specified role
    // 3. Mark the invitation as accepted
    // 4. Remove or expire the invitation token
    
    // For now, we'll just return a success response
    // You should implement the actual organization membership logic
    res.json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error('Error in acceptInvite:', error);
    res.status(400).json({ error: 'Failed to accept invitation' });
  }
};

export const removeMember = async (req, res) => {
  try {
    // Only admin can remove members
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { userId } = req.params;

    const user = await User.findOne({
      _id: userId,
      organization: req.organizationId
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from removing themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    await user.remove();
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

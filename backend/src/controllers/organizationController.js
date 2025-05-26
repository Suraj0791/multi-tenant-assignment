import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
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
// Helper to check if user can be invited
const canInviteUser = async (email, organizationId) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // If user exists, check if they're already in the organization
    if (existingUser.organization?.toString() === organizationId.toString()) {
      throw new Error('User is already a member of this organization');
    }
    // If user exists but in different org, they can be invited
    return true;
  }
  return true;
};

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

    // Check if user can be invited
    await canInviteUser(email, req.organizationId);

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      email,
      organization: req.organizationId,
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'An invitation is already pending for this email' });
    }

    // Find organization
    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Generate invite token and create invitation
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const invitation = new Invitation({
      token: inviteToken,
      email,
      organization: req.organizationId,
      role,
      createdBy: req.user._id
    });

    await invitation.save();

    // Generate invite link
    const inviteLink = `${config.frontendUrl}/register?invite=${inviteToken}`;

    // Send invitation email
    try {
      await sendInvitationEmail(
        email,
        organization.name,
        inviteLink
      );
      console.log('--- INVITE MEMBER: Email sent successfully to:', email, '---');
    } catch (error) {
      console.warn('Email sending failed:', error.message);
      // We don't throw here as we still want to return the invite link
    }

    // Return both success message and invite link
    res.json({ 
      message: 'Invitation sent successfully',
      inviteLink,
      inviteToken,
      email,
      role,
      organizationName: organization.name,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    console.error('--- INVITE MEMBER: CAUGHT ERROR ---', error.name, error.message, error.stack); // Add server-side logging
    res.status(400).json({ error: error.message });
  }
};

// Update member role
// Get current organization details
export const getCurrentOrganization = async (req, res) => {
  try {
    // Get organization from auth middleware
    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
    let invitation;
    if (inviteToken === 'latest') {
      // Get the latest invitation
      invitation = await Invitation.findOne({ 
        status: 'pending',
        expiresAt: { $gt: new Date() }
      })
      .sort({ createdAt: -1 })
      .populate('organization', 'name');
    } else {
      // Get invitation by token
      invitation = await Invitation.findOne({ 
        token: inviteToken,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      }).populate('organization', 'name');
    }

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    res.json({
      token: invitation.token,
      email: invitation.email,
      organizationName: invitation.organization.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt
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
    // Find and validate invitation
    const invitation = await Invitation.findOne({ 
      token: inviteToken,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('organization');

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    // Get the authenticated user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user is already in an organization, they can't join another
    if (user.organization) {
      return res.status(400).json({ 
        error: 'You are already a member of an organization. Please leave your current organization before joining another.'
      });
    }

    // Update user's organization and role
    user.organization = invitation.organization._id;
    user.role = invitation.role;
    await user.save();

    // Mark invitation as accepted
    invitation.status = 'accepted';
    await invitation.save();

    res.json({ 
      message: 'Invitation accepted successfully',
      organization: {
        id: invitation.organization._id,
        name: invitation.organization.name
      }
    });
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

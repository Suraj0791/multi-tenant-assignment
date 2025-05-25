import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { sendInvitationEmail } from '../utils/email.js';
import crypto from 'crypto';

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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const organization = await Organization.findById(req.organizationId);

    // Create invite link
    const inviteLink = `${process.env.FRONTEND_URL}/join/${inviteToken}`;

    // Store invitation in memory (should be stored in database in production)
    // For this demo, we'll just send the email
    await sendInvitationEmail(email, organization.name, inviteLink);

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update member role
export const updateMemberRole = async (req, res) => {
  try {
    // Only admin can update roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { userId, role } = req.body;

    // Validate role
    if (!['member', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findOne({
      _id: userId,
      organization: req.organizationId
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot change own role' });
    }

    user.role = role;
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Remove member
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

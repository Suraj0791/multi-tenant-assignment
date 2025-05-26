import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Invitation from '../models/Invitation.js';
import { config } from '../config/index.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '24h' });
};

// Helper to create organization and admin user
const createOrganization = async (organizationName, userData) => {
  try {
    // Check if organization exists by name
    const existingOrg = await Organization.findOne({ 
      name: { $regex: new RegExp(`^${organizationName}$`, 'i') } 
    });
    if (existingOrg) {
      throw new Error('Organization already exists. Please ask an Admin to invite you.');
    }

    // Create organization with slug
    const organizationSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists
    const existingSlug = await Organization.findOne({ slug: organizationSlug });
    if (existingSlug) {
      throw new Error('Organization with similar name already exists. Please choose a different name.');
    }

    const organization = new Organization({
      name: organizationName,
      slug: organizationSlug
    });
    await organization.save();

    // Create admin user
    const user = new User({
      ...userData,
      organization: organization._id,
      role: 'admin' // First user is admin
    });
    await user.save();

    return { user, organization };
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.name) {
        throw new Error('Organization already exists. Please ask an Admin to invite you.');
      } else if (error.keyPattern.slug) {
        throw new Error('Organization with similar name already exists. Please choose a different name.');
      }
    }
    throw error;
  }
};

// Register new user (with optional organization)
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, organizationName, inviteToken, organizationId } = req.body;

    // Prevent direct organization assignment
    if (organizationId) {
      return res.status(400).json({ error: 'Cannot directly join an organization. Please use an invitation.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    let user, organization;

    // If inviteToken is provided, verify and accept invitation
    if (inviteToken) {
      const invitation = await Invitation.findOne({ 
        token: inviteToken,
        email: email.toLowerCase(),
        status: 'pending',
        expiresAt: { $gt: new Date() }
      }).populate('organization');

      if (!invitation) {
        return res.status(400).json({ error: 'Invalid or expired invitation' });
      }

      // Create user with invitation details
      user = new User({
        email,
        password,
        firstName,
        lastName,
        organization: invitation.organization._id,
        role: invitation.role
      });
      await user.save();

      // Mark invitation as accepted
      invitation.status = 'accepted';
      await invitation.save();

      organization = invitation.organization;
    } 
    // If organizationName is provided, check if it exists first
    else if (organizationName) {
      // Check if organization already exists
      const existingOrg = await Organization.findOne({ name: organizationName });
      if (existingOrg) {
        return res.status(400).json({ 
          error: 'Organization already exists. Please ask an Admin to invite you.'
        });
      }

      // Create new organization since it doesn't exist
      const result = await createOrganization(organizationName, {
        email,
        password,
        firstName,
        lastName
      });
      user = result.user;
      organization = result.organization;
    } 
    // If neither inviteToken nor organizationName, just create the user without organization
    else {
      user = new User({
        email,
        password,
        firstName,
        lastName
      });
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organization: organization ? {
          id: organization._id,
          name: organization.name,
          slug: organization.slug
        } : null
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).populate('organization');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organization: user.organization ? {
          id: user.organization._id,
          name: user.organization.name,
          slug: user.organization.slug
        } : null
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('organization');
    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organization: user.organization ? {
          id: user.organization._id,
          name: user.organization.name,
          slug: user.organization.slug
        } : null
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

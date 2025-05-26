import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/index.js';

export const auth = async (req, res, next) => {
  console.log(`--- AUTH MIDDLEWARE CALLED for ${req.method} ${req.originalUrl} ---`);
  try {
    console.log('--- AUTH: Attempting to extract token ---');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('--- AUTH: Token extracted (or not):', token ? 'Token Present' : 'No Token');
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('--- AUTH: Attempting to verify token ---');
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log('--- AUTH: Token verified and decoded:', decoded);

    console.log('--- AUTH: Attempting to find user with ID:', decoded.userId, '---');
    const user = await User.findOne({ _id: decoded.userId, isActive: true });
    console.log('--- AUTH: User findOne result:', user ? user.email : 'User Not Found');
    if (!user) {
      throw new Error('User not found');
    }

    console.log('--- AUTH: Attaching user to request ---');
    req.user = user;
    console.log('--- AUTH: Checking for organization ---');
    if (user.organization) {
      req.organizationId = user.organization.toString(); // Ensure it's a string if it's an ObjectId
      console.log('--- AUTH: Organization ID attached:', req.organizationId);
    } else {
      console.log('--- AUTH: User does not have an organization field or it is null/undefined ---');
    }

    console.log('--- AUTH: Successfully processed, calling next() ---');
    next();
  } catch (error) {
    console.error('--- AUTH MIDDLEWARE ERROR ---', error.name, error.message, error.stack);
    if (error.message === 'Authentication required') {
      console.log('--- AUTH: No token found, sending 401 ---');
      return res.status(401).json({ error: 'No token, authorization denied' });
    }
    res.status(401).json({ error: 'Please authenticate' });
  }
};

export const authorize = (...roles) => {
  console.log('--- AUTHORIZE MIDDLEWARE CALLED ---');
  console.log('--- AUTHORIZE: Required roles:', roles);
  return (req, res, next) => {
    console.log('--- AUTHORIZE: User details:', req.user ? { email: req.user.email, role: req.user.role, id: req.user._id } : 'No req.user');
    if (!req.user || !req.user.role) {
      console.error('--- AUTHORIZE ERROR: req.user or req.user.role is undefined ---');
      return res.status(500).json({ error: 'Authorization error: User data missing' });
    }
    console.log('--- AUTHORIZE: Checking if user role', req.user.role, 'is in required roles', roles, '---');
    if (!roles.includes(req.user.role)) {
      console.log('--- AUTHORIZE: Permission DENIED. User role:', req.user.role, 'Required:', roles, '---');
      return res.status(403).json({ 
        error: 'You do not have permission to perform this action' 
      });
    }
    console.log('--- AUTHORIZE: Permission GRANTED. Calling next() ---');
    next();
  };
};

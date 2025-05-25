import express from 'express';
import {
  getOrganization,
  updateOrganization,
  getMembers,
  inviteMember,
  updateMemberRole,
  removeMember
} from '../controllers/organizationController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get organization details
router.get('/', getOrganization);

// Update organization
router.patch('/', authorize('admin'), updateOrganization);

// Get all members
router.get('/members', getMembers);

// Invite new member
router.post('/members/invite', authorize('admin', 'manager'), inviteMember);

// Update member role
router.patch('/members/:userId/role', authorize('admin'), updateMemberRole);

// Remove member
router.delete('/members/:userId', authorize('admin'), removeMember);

export default router;

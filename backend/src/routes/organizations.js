import express from 'express';
import {
  getOrganization,
  updateOrganization,
  getMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  verifyInvite,
  acceptInvite,
  getCurrentOrganization,
  getOrganizationSettings
} from '../controllers/organizationController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Verify invitation token (public endpoint)
router.get('/invites/verify/:inviteToken', verifyInvite);

// Protected routes below
router.use(auth);

// Get organization details
router.get('/', getOrganization);

// Update organization
router.patch('/', authorize('admin'), updateOrganization);

// Get organization settings
router.get('/settings', getOrganizationSettings);

// Get current organization
router.get('/current', auth, getCurrentOrganization);

// Get all members
router.get('/members', getMembers);

// Invite new member
router.post('/members/invite', authorize('admin', 'manager'), inviteMember);

// Update member role
router.patch('/members/:userId/role', authorize('admin'), updateMemberRole);

// Remove member
router.delete('/members/:userId', authorize('admin'), removeMember);

// Accept invitation (requires authentication)
router.post('/invites/accept/:inviteToken', acceptInvite);

export default router;

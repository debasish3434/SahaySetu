import express from 'express';
import { protect, requireSuperAdmin } from '../middleware/auth.js';
import {
  getSuperAdminOverview, listApplications, decideApplication,
  listAdministrators, inviteAdministrator, resetAdministratorCredentials, setAdministratorActive, listActivityLogs,
  updateAdministratorPermissions,
  revokeAdministratorAccess,
} from '../controllers/superAdminController.js';

const router = express.Router();

// All routes require JWT + isSuperAdmin === true
router.use(protect, requireSuperAdmin);

router.get('/overview', getSuperAdminOverview);

// Pending approvals for volunteers & coordinators
router.get('/applications', listApplications);
router.patch('/applications/:userId', decideApplication);

// Administrator management (Super Admin only)
router.get('/administrators', listAdministrators);
router.post('/administrators/invitations', inviteAdministrator);
router.patch('/administrators/:userId/credentials', resetAdministratorCredentials);
router.patch('/administrators/:userId/status', setAdministratorActive);
router.patch('/administrators/:userId/permissions', updateAdministratorPermissions);
router.patch('/administrators/:userId/revoke', revokeAdministratorAccess);

// Activity logs
router.get('/activity', listActivityLogs);

export default router;

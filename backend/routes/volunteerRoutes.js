import express from 'express';
import {
  applyAsVolunteer,
  getPendingVolunteers,
  verifyVolunteer,
  getVerifiedVolunteers,
  getAllVolunteers,
  getVolunteerHistory,
} from '../controllers/volunteerController.js';
import { protect, authorize, authorizeSuperAdmin } from '../middleware/auth.js';
import { applyVolunteerValidation, verifyVolunteerValidation } from '../utils/validators.js';

const router = express.Router();

router.use(protect);

router.post('/apply', applyVolunteerValidation, applyAsVolunteer);
router.get('/pending', authorize('coordinator', 'admin'), getPendingVolunteers);
router.get('/verified', authorize('coordinator', 'admin'), getVerifiedVolunteers);
router.get('/all', authorize('coordinator', 'admin'), getAllVolunteers);
router.get('/history', authorize('volunteer'), getVolunteerHistory);
router.patch('/:userId/verify', authorizeSuperAdmin, verifyVolunteerValidation, verifyVolunteer);

export default router;

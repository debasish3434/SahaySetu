import express from 'express';
import { getDashboardStats, getAdminVolunteers } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/volunteers', getAdminVolunteers);

export default router;

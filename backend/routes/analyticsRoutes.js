import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getIncidentStats,
  getVolunteerStats,
  getResourceStats,
  getSystemOverview,
} from '../controllers/analyticsController.js';

const router = express.Router();

// All analytics routes require authentication
router.get('/incidents', protect, authorize('coordinator', 'admin'), getIncidentStats);
router.get('/volunteers', protect, authorize('coordinator', 'admin'), getVolunteerStats);
router.get('/resources', protect, authorize('coordinator', 'admin'), getResourceStats);
router.get('/overview', protect, authorize('admin'), getSystemOverview);

export default router;

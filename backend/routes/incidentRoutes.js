import express from 'express';
import {
  createIncident,
  getIncidents,
  getIncidentStats,
  getNearbyIncidents,
  getIncidentById,
  updateIncidentStatus,
  assignVolunteerToIncident,
  getMyTasks,
  acceptTask,
  updateTaskStatus,
} from '../controllers/incidentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadIncidentMedia } from '../middleware/upload.js';
import { createIncidentValidation } from '../utils/validators.js';

const router = express.Router();
router.use(protect);

router.get('/stats', getIncidentStats);
router.get('/nearby', getNearbyIncidents);
router.get('/my-tasks', authorize('volunteer'), getMyTasks);
router.get('/', getIncidents);
router.post('/', uploadIncidentMedia, createIncidentValidation, createIncident);

router.get('/:id', getIncidentById);
router.patch('/:id/status', authorize('coordinator', 'admin'), updateIncidentStatus);
router.patch('/:id/assign', authorize('coordinator', 'admin'), assignVolunteerToIncident);
router.patch('/:id/accept-task', authorize('volunteer'), acceptTask);
router.patch('/:id/task-status', authorize('volunteer'), updateTaskStatus);

export default router;

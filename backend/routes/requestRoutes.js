import express from 'express';
import {
  createEmergencyRequest,
  getMyRequests,
  getAllRequests,
  getRequestById,
  updateRequestPriority,
  assignVolunteerToRequest,
  updateRequestStatus,
} from '../controllers/requestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createEmergencyRequest);
router.get('/my-requests', getMyRequests);
router.get('/', authorize('coordinator', 'admin'), getAllRequests);
router.get('/:id', getRequestById);
router.patch('/:id/priority', authorize('coordinator', 'admin'), updateRequestPriority);
router.patch('/:id/assign', authorize('coordinator', 'admin'), assignVolunteerToRequest);
router.patch('/:id/status', authorize('coordinator', 'admin'), updateRequestStatus);

export default router;

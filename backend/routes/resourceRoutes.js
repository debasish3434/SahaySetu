import express from 'express';
import {
  addResource,
  getResources,
  updateResource,
  deleteResource,
  getResourceStats,
} from '../controllers/resourceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/stats', authorize('coordinator', 'admin'), getResourceStats);
router.post('/', authorize('coordinator', 'admin'), addResource);
router.get('/', authorize('coordinator', 'admin'), getResources);
router.put('/:id', authorize('coordinator', 'admin'), updateResource);
router.delete('/:id', authorize('coordinator', 'admin'), deleteResource);

export default router;

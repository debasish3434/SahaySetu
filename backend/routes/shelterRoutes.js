import express from 'express';
import {
  registerShelter,
  getShelters,
  getNearbyShelters,
  getShelterById,
  updateShelterCapacity,
} from '../controllers/shelterController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('coordinator', 'admin'), registerShelter);
router.get('/nearby', getNearbyShelters);
router.get('/', getShelters);
router.get('/:id', getShelterById);
router.put('/:id/capacity', authorize('coordinator', 'admin'), updateShelterCapacity);

export default router;

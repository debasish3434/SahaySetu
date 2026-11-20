import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../controllers/systemSettingsController.js';

const router = express.Router();

router.get('/', protect, getSettings);
router.put('/', protect, authorize('admin'), updateSettings);

export default router;

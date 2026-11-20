import express from 'express';
import { getProfile, updateProfile, uploadProfilePhotoHandler, updateSettings } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { uploadProfilePhoto } from '../middleware/upload.js';
import { updateProfileValidation, updateSettingsValidation } from '../utils/validators.js';

const router = express.Router();

router.use(protect); // all routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, updateProfile);
router.put('/profile/photo', uploadProfilePhoto, uploadProfilePhotoHandler);
router.put('/settings', updateSettingsValidation, updateSettings);

export default router;

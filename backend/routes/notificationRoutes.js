import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getMyNotifications,
  markAllAsRead,
  markAsRead,
  deleteNotification,
  createAnnouncement,
} from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.get('/', protect, getMyNotifications);
router.patch('/read-all', protect, markAllAsRead);
router.patch('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);
router.post('/announcement', protect, authorize('admin'), createAnnouncement);

export default router;

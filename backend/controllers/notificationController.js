import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// ---------------------------------------------------------------------------
// Internal helper — NOT a route handler. Import and call from other controllers.
// ---------------------------------------------------------------------------

/**
 * Creates a single notification document.
 * @param {{ recipient, type, title, message, relatedId?, relatedModel?, createdBy?, metadata? }} opts
 * @returns {Promise<import('../models/Notification.js').default>}
 */
export async function createNotification({ recipient, type, title, message, relatedId, relatedModel, createdBy, metadata }) {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedId: relatedId || undefined,
      relatedModel: relatedModel || undefined,
      createdBy: createdBy || undefined,
      metadata: metadata || undefined,
    });
    return notification;
  } catch (err) {
    // Non-fatal — log but don't crash the calling request
    console.error('[createNotification] failed:', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * @desc    Get current user's notifications (paginated, filterable)
 * @route   GET /api/notifications
 * @access  Private
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const query = { recipient: req.user._id };
  if (req.query.isRead !== undefined) {
    query.isRead = req.query.isRead === 'true';
  }
  if (req.query.type) {
    query.type = req.query.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to modify this notification');
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({ success: true, message: 'Notification marked as read', notification });
});

/**
 * @desc    Mark all notifications as read for current user
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({ success: true, message: `${result.modifiedCount} notifications marked as read` });
});

/**
 * @desc    Delete own notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this notification');
  }

  await notification.deleteOne();

  res.status(200).json({ success: true, message: 'Notification deleted' });
});

/**
 * @desc    Admin: create announcement for all users (or by role)
 * @route   POST /api/notifications/announcement
 * @access  Private (Admin only)
 */
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, targetRoles } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error('Title and message are required');
  }

  // Build user filter
  const userQuery = {};
  const validRoles = ['citizen', 'volunteer', 'coordinator', 'admin'];
  if (Array.isArray(targetRoles) && targetRoles.length > 0) {
    const filtered = targetRoles.filter((r) => validRoles.includes(r));
    if (filtered.length > 0) userQuery.role = { $in: filtered };
  }

  const users = await User.find(userQuery).select('_id').lean();

  if (users.length === 0) {
    res.status(400);
    throw new Error('No users found matching the specified roles');
  }

  const notifications = users.map((u) => ({
    recipient: u._id,
    type: 'announcement',
    title,
    message,
    createdBy: req.user._id,
  }));

  await Notification.insertMany(notifications, { ordered: false });

  res.status(201).json({
    success: true,
    message: `Announcement sent to ${users.length} user(s)`,
    recipientCount: users.length,
  });
});

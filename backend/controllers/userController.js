import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { useCloudinary } from '../middleware/upload.js';

/**
 * @desc    Get logged-in user's profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, user });
});

/**
 * @desc    Update logged-in user's profile details
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, bio } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (bio !== undefined) user.bio = bio;

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser,
  });
});

/**
 * @desc    Upload / replace profile photo
 * @route   PUT /api/users/profile/photo
 * @access  Private
 */
export const uploadProfilePhotoHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please select an image to upload');
  }

  const user = await User.findById(req.user._id);

  // Remove the previous photo from Cloudinary, if one exists, to avoid orphaned assets
  if (user.profilePhoto?.publicId && useCloudinary) {
    await cloudinary.uploader.destroy(user.profilePhoto.publicId).catch(() => {});
  }

  user.profilePhoto = {
    url: useCloudinary ? req.file.path : `/uploads/profile-photos/${req.file.filename}`,
    publicId: req.file.filename,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile photo updated successfully',
    user,
  });
});

/**
 * @desc    Update account settings (notifications, deactivate account)
 * @route   PUT /api/users/settings
 * @access  Private
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const { notificationsEnabled, isActive } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (notificationsEnabled !== undefined) {
    user.settings = user.settings || {};
    user.settings.notificationsEnabled = Boolean(notificationsEnabled);
  }

  if (isActive !== undefined) {
    if (isActive === false) {
      user.isActive = false;
      await user.save();
      return res.status(200).json({
        success: true,
        message: 'Account deactivated successfully. You have been logged out.',
        user,
      });
    } else if (isActive === true && !['admin', 'coordinator'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Self-reactivation is not allowed. Please contact an administrator or coordinator.');
    }
  }

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    user: updatedUser,
  });
});

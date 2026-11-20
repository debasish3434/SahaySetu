import asyncHandler from 'express-async-handler';
import SystemSetting from '../models/SystemSetting.js';

/**
 * @desc    Get system settings (singleton document)
 * @route   GET /api/settings
 * @access  Private
 */
export const getSettings = asyncHandler(async (req, res) => {
  // Fetch the single settings document; if none exists, return defaults via findOneAndUpdate upsert
  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = await SystemSetting.create({});
  }

  res.status(200).json({ success: true, settings });
});

/**
 * @desc    Update system settings (admin only)
 * @route   PUT /api/settings
 * @access  Private (Admin)
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const { maintenanceMode, maxIncidentsPerPage, alertRadiusKm, platformName, supportEmail } = req.body;

  const update = {};
  if (maintenanceMode !== undefined) update.maintenanceMode = Boolean(maintenanceMode);
  if (maxIncidentsPerPage !== undefined) update.maxIncidentsPerPage = parseInt(maxIncidentsPerPage, 10);
  if (alertRadiusKm !== undefined) update.alertRadiusKm = parseInt(alertRadiusKm, 10);
  if (platformName !== undefined) update.platformName = platformName;
  if (supportEmail !== undefined) update.supportEmail = supportEmail;

  const settings = await SystemSetting.findOneAndUpdate(
    {},
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({ success: true, message: 'Settings updated', settings });
});

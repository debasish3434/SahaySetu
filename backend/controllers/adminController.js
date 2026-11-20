import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Incident from '../models/Incident.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import Shelter from '../models/Shelter.js';
import Resource from '../models/Resource.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const can = (permission) => req.user.isSuperAdmin || req.user.adminPermissions?.includes(permission);
  const stats = {};
  if (can('volunteer_management')) {
    const [pendingVerifications, verifiedVolunteers] = await Promise.all([
      User.countDocuments({ role: 'volunteer', 'volunteerProfile.verificationStatus': 'pending' }),
      User.countDocuments({ role: 'volunteer', 'volunteerProfile.verificationStatus': 'verified' }),
    ]);
    stats.volunteers = { pendingVerifications, verified: verifiedVolunteers };
  }
  if (can('incident_management')) {
    const [total, reported, verified, inProgress, resolved, rejected] = await Promise.all([
      Incident.countDocuments(), Incident.countDocuments({ status: 'reported' }), Incident.countDocuments({ status: 'verified' }),
      Incident.countDocuments({ status: 'in-progress' }), Incident.countDocuments({ status: 'resolved' }), Incident.countDocuments({ status: 'rejected' }),
    ]);
    stats.incidents = { total, reported, verified, inProgress, resolved, rejected };
  }
  if (can('request_management')) {
    const [total, open, critical, closed] = await Promise.all([
      EmergencyRequest.countDocuments(), EmergencyRequest.countDocuments({ status: { $nin: ['closed'] } }),
      EmergencyRequest.countDocuments({ priority: 'critical' }), EmergencyRequest.countDocuments({ status: 'closed' }),
    ]);
    stats.requests = { total, open, critical, closed };
  }
  if (can('shelter_management')) {
    const [total, open, full] = await Promise.all([Shelter.countDocuments(), Shelter.countDocuments({ status: 'open' }), Shelter.countDocuments({ status: 'full' })]);
    stats.shelters = { total, open, full };
  }
  if (can('resource_management')) {
    const [total, low, depleted] = await Promise.all([Resource.countDocuments(), Resource.countDocuments({ status: 'low' }), Resource.countDocuments({ status: 'depleted' })]);
    stats.resources = { total, low, depleted };
  }
  res.status(200).json({ success: true, stats });
});

export const getAdminVolunteers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const query = { role: 'volunteer' };
  if (req.query.status) query['volunteerProfile.verificationStatus'] = req.query.status;
  if (req.query.search) {
    const search = String(req.query.search).trim().slice(0, 80);
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query).select('-password -resetPasswordToken -resetPasswordExpire').sort({ createdAt: -1 }).skip(skip).limit(limit);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    users,
  });
});

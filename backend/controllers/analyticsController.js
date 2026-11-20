import asyncHandler from 'express-async-handler';
import Incident from '../models/Incident.js';
import Resource from '../models/Resource.js';
import User from '../models/User.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import Shelter from '../models/Shelter.js';

/**
 * @desc    Get incident statistics
 * @route   GET /api/analytics/incidents
 * @access  Coordinator, Admin
 */
export const getIncidentStats = asyncHandler(async (req, res) => {
  // Total incidents
  const total = await Incident.countDocuments();

  // By status
  const [reported, verified, inProgress, resolved, rejected] = await Promise.all([
    Incident.countDocuments({ status: 'reported' }),
    Incident.countDocuments({ status: 'verified' }),
    Incident.countDocuments({ status: 'in-progress' }),
    Incident.countDocuments({ status: 'resolved' }),
    Incident.countDocuments({ status: 'rejected' }),
  ]);

  // By category — aggregate
  const categoryAgg = await Incident.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const byCategory = categoryAgg.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  // By severity — aggregate
  const severityAgg = await Incident.aggregate([
    { $group: { _id: '$severity', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const bySeverity = severityAgg.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  // By month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthAgg = await Incident.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  const byMonth = monthAgg.map((item) => ({
    year: item._id.year,
    month: item._id.month,
    count: item.count,
  }));

  res.status(200).json({
    success: true,
    stats: {
      total,
      byStatus: { reported, verified, 'in-progress': inProgress, resolved, rejected },
      byCategory,
      bySeverity,
      byMonth,
    },
  });
});

/**
 * @desc    Get volunteer statistics
 * @route   GET /api/analytics/volunteers
 * @access  Coordinator, Admin
 */
export const getVolunteerStats = asyncHandler(async (req, res) => {
  // Total volunteers & verified count
  const [total, verified, tasksCompleted, tasksInProgress, tasksAssigned] = await Promise.all([
    User.countDocuments({ role: 'volunteer' }),
    User.countDocuments({ role: 'volunteer', 'volunteerProfile.verificationStatus': 'verified' }),
    Incident.countDocuments({ taskStatus: 'completed' }),
    Incident.countDocuments({ taskStatus: 'in-progress' }),
    Incident.countDocuments({ taskStatus: 'assigned' }),
  ]);

  // Top volunteers by tasks completed — aggregate Incident by assignedVolunteer
  const topVolunteersAgg = await Incident.aggregate([
    { $match: { taskStatus: 'completed', assignedVolunteer: { $ne: null } } },
    { $group: { _id: '$assignedVolunteer', tasksCompleted: { $sum: 1 } } },
    { $sort: { tasksCompleted: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'volunteerInfo',
      },
    },
    { $unwind: { path: '$volunteerInfo', preserveNullAndEmpty: false } },
    {
      $project: {
        _id: 1,
        tasksCompleted: 1,
        name: '$volunteerInfo.name',
        email: '$volunteerInfo.email',
      },
    },
  ]);

  res.status(200).json({
    success: true,
    stats: {
      total,
      verified,
      tasksCompleted,
      tasksInProgress,
      tasksAssigned,
      topVolunteers: topVolunteersAgg,
    },
  });
});

/**
 * @desc    Get resource statistics
 * @route   GET /api/analytics/resources
 * @access  Coordinator, Admin
 */
export const getResourceStats = asyncHandler(async (req, res) => {
  // Total resources & by status
  const [total, available, low, depleted] = await Promise.all([
    Resource.countDocuments(),
    Resource.countDocuments({ status: 'available' }),
    Resource.countDocuments({ status: 'low' }),
    Resource.countDocuments({ status: 'depleted' }),
  ]);

  // By category — aggregate
  const categoryAgg = await Resource.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
    { $sort: { count: -1 } },
  ]);
  const byCategory = categoryAgg.reduce((acc, item) => {
    acc[item._id] = { count: item.count, totalQuantity: item.totalQuantity };
    return acc;
  }, {});

  // Total quantity allocated (sum of quantity where status != 'available')
  const allocatedAgg = await Resource.aggregate([
    { $match: { status: { $ne: 'available' } } },
    { $group: { _id: null, totalAllocated: { $sum: '$quantity' } } },
  ]);
  const totalQuantityAllocated = allocatedAgg.length > 0 ? allocatedAgg[0].totalAllocated : 0;

  res.status(200).json({
    success: true,
    stats: {
      total,
      byStatus: { available, low, depleted },
      byCategory,
      totalQuantityAllocated,
    },
  });
});

/**
 * @desc    Get system-wide overview (admin analytics dashboard)
 * @route   GET /api/analytics/overview
 * @access  Admin
 */
export const getSystemOverview = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    citizens,
    volunteers,
    coordinators,
    admins,
    pendingVerifications,
    verifiedVolunteers,
    totalIncidents,
    reportedIncidents,
    verifiedIncidents,
    inProgressIncidents,
    resolvedIncidents,
    rejectedIncidents,
    totalRequests,
    openRequests,
    criticalRequests,
    closedRequests,
    totalShelters,
    openShelters,
    fullShelters,
    totalResources,
    lowResources,
    depletedResources,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
    User.countDocuments({ role: 'citizen' }),
    User.countDocuments({ role: 'volunteer' }),
    User.countDocuments({ role: 'coordinator' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'volunteer', 'volunteerProfile.verificationStatus': 'pending' }),
    User.countDocuments({ role: 'volunteer', 'volunteerProfile.verificationStatus': 'verified' }),
    Incident.countDocuments(),
    Incident.countDocuments({ status: 'reported' }),
    Incident.countDocuments({ status: 'verified' }),
    Incident.countDocuments({ status: 'in-progress' }),
    Incident.countDocuments({ status: 'resolved' }),
    Incident.countDocuments({ status: 'rejected' }),
    EmergencyRequest.countDocuments(),
    EmergencyRequest.countDocuments({ status: { $nin: ['closed'] } }),
    EmergencyRequest.countDocuments({ priority: 'critical' }),
    EmergencyRequest.countDocuments({ status: 'closed' }),
    Shelter.countDocuments(),
    Shelter.countDocuments({ status: 'open' }),
    Shelter.countDocuments({ status: 'full' }),
    Resource.countDocuments(),
    Resource.countDocuments({ status: 'low' }),
    Resource.countDocuments({ status: 'depleted' }),
  ]);

  res.status(200).json({
    success: true,
    overview: {
      users: {
        total: totalUsers,
        activeUsers,
        inactiveUsers,
        citizens,
        volunteers,
        coordinators,
        admins,
        pendingVerifications,
        verifiedVolunteers,
      },
      incidents: {
        total: totalIncidents,
        reported: reportedIncidents,
        verified: verifiedIncidents,
        inProgress: inProgressIncidents,
        resolved: resolvedIncidents,
        rejected: rejectedIncidents,
      },
      requests: {
        total: totalRequests,
        open: openRequests,
        critical: criticalRequests,
        closed: closedRequests,
      },
      shelters: {
        total: totalShelters,
        open: openShelters,
        full: fullShelters,
      },
      resources: {
        total: totalResources,
        low: lowResources,
        depleted: depletedResources,
      },
    },
  });
});

import asyncHandler from 'express-async-handler';
import Incident from '../models/Incident.js';
import User from '../models/User.js';
import { mapUploadedPhotos, mapUploadedMedia } from '../middleware/upload.js';
import { createNotification } from './notificationController.js';

/**
 * @desc    Report a new incident with photo/video uploads and GPS location
 * @route   POST /api/incidents
 * @access  Private
 */
export const createIncident = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    severity,
    latitude,
    longitude,
    address,
    contactPhone,
    peopleAffected,
  } = req.body;

  let media = [];
  if (req.files && (req.files.photos || req.files.videos)) {
    media = await mapUploadedMedia(req.files);
  } else if (Array.isArray(req.files)) {
    media = mapUploadedPhotos(req.files);
  }

  const incident = await Incident.create({
    title,
    description,
    category,
    severity,
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
      address: address || '',
    },
    media,
    contactPhone,
    peopleAffected: peopleAffected || 0,
    reportedBy: req.user._id,
  });

  const populatedIncident = await incident.populate('reportedBy', 'name email phone profilePhoto');

  // Alert operational roles as soon as a new incident enters the system.
  const responders = await User.find({ role: { $in: ['coordinator', 'admin'] }, isActive: true }).select('_id').lean();
  await Promise.all(responders.map(({ _id }) => createNotification({
    recipient: _id,
    type: 'emergency_alert',
    title: `New ${severity || 'incident'} report`,
    message: `${title} — ${address || 'Location not provided'} (${severity || 'priority not set'} priority).`,
    relatedId: incident._id,
    relatedModel: 'Incident',
    createdBy: req.user._id,
    metadata: { category, severity, address: address || '' },
  })));

  res.status(201).json({
    success: true,
    message: 'Incident reported successfully',
    incident: populatedIncident,
  });
});

/**
 * @desc    Get incidents near a location
 * @route   GET /api/incidents/nearby
 * @access  Private
 */
export const getNearbyIncidents = asyncHandler(async (req, res) => {
  const { lat, lng, radius } = req.query;

  if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    res.status(400);
    throw new Error('Latitude (lat) and longitude (lng) are required numeric parameters');
  }

  const searchRadius = parseFloat(radius) || 5000;

  const incidents = await Incident.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: searchRadius,
      },
    },
  }).populate('reportedBy', 'name email phone profilePhoto');

  res.status(200).json({
    success: true,
    count: incidents.length,
    incidents,
  });
});

export const getIncidents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const skip = (page - 1) * limit;

  const query = {};

  // Volunteers only see verified incidents unless a status filter is explicitly passed
  if (req.user.role === 'volunteer' && !req.query.status) {
    query.status = 'verified';
  } else if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.category) query.category = req.query.category;
  if (req.query.severity) query.severity = req.query.severity;
  if (req.query.mine === 'true') query.reportedBy = req.user._id;

  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const total = await Incident.countDocuments(query);
  const incidents = await Incident.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reportedBy', 'name email phone profilePhoto')
    .populate('assignedVolunteer', 'name email phone profilePhoto');

  res.status(200).json({
    success: true,
    count: incidents.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    incidents,
  });
});

/**
 * @desc    Get incident counts grouped by status (for dashboards)
 * @route   GET /api/incidents/stats
 * @access  Private
 */
export const getIncidentStats = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.mine === 'true') query.reportedBy = req.user._id;
  if (req.user.role === 'volunteer') query.status = 'verified';

  const statuses = ['reported', 'verified', 'resolved', 'rejected'];
  const byStatus = {};
  for (const status of statuses) {
    byStatus[status] = await Incident.countDocuments({ ...query, status });
  }

  const total = await Incident.countDocuments(query);
  const critical = await Incident.countDocuments({ ...query, severity: 'critical' });
  const highOrCritical = await Incident.countDocuments({
    ...query,
    severity: { $in: ['high', 'critical'] },
  });

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await Incident.countDocuments({ ...query, createdAt: { $gte: oneDayAgo } });

  res.status(200).json({
    success: true,
    stats: { total, byStatus, critical, highOrCritical, recent },
  });
});

export const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id)
    .populate('reportedBy')
    .populate('assignedVolunteer', 'name email phone profilePhoto volunteerProfile');

  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }

  res.status(200).json({
    success: true,
    incident,
  });
});

export const updateIncidentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['reported', 'verified', 'in-progress', 'resolved', 'rejected'];

  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }

  // Enforce Review 1 lifecycle: REPORTED → VERIFIED → RESOLVED (reject from reported)
  const validTransitions = {
    reported: ['verified', 'rejected'],
    verified: ['resolved'],
    resolved: [],
    rejected: [],
    'in-progress': ['resolved'],
  };

  const allowedNext = validTransitions[incident.status] || [];
  if (!allowedNext.includes(status)) {
    res.status(400);
    throw new Error(`Cannot change status from '${incident.status}' to '${status}'`);
  }

  const oldStatus = incident.status;
  incident.status = status;
  await incident.save();

  // Notify the reporter about the status change
  if (incident.reportedBy) {
    await createNotification({
      recipient: incident.reportedBy,
      type: 'incident_status',
      title: 'Incident Status Updated',
      message: `Your incident "${incident.title}" status changed from '${oldStatus}' to '${status}'.`,
      relatedId: incident._id,
      relatedModel: 'Incident',
      createdBy: req.user._id,
    });
  }

  const populated = await incident.populate('reportedBy', 'name email phone profilePhoto');

  res.status(200).json({
    success: true,
    message: 'Incident status updated',
    incident: populated,
  });
});

/**
 * @desc    Assign a verified volunteer to an incident
 * @route   PATCH /api/incidents/:id/assign
 * @access  Private (Coordinator / Admin)
 */
export const assignVolunteerToIncident = asyncHandler(async (req, res) => {
  const { volunteerId } = req.body;

  if (!volunteerId) {
    res.status(400);
    throw new Error('Volunteer ID is required');
  }

  const volunteer = await User.findById(volunteerId);
  if (
    !volunteer ||
    volunteer.role !== 'volunteer' ||
    volunteer.volunteerProfile?.verificationStatus !== 'verified'
  ) {
    res.status(400);
    throw new Error('Volunteer is not verified');
  }

  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }

  incident.assignedVolunteer = volunteerId;
  incident.taskStatus = 'assigned';
  await incident.save();

  await createNotification({
    recipient: volunteerId,
    type: 'volunteer_assignment',
    title: 'New incident task assigned',
    message: `${incident.title} — ${incident.location?.address || 'Location details are available in the incident.'}`,
    relatedId: incident._id,
    relatedModel: 'Incident',
    createdBy: req.user._id,
    metadata: { category: incident.category, severity: incident.severity, taskStatus: incident.taskStatus },
  });

  const populated = await incident
    .populate('reportedBy', 'name email phone profilePhoto')
    .populate('assignedVolunteer', 'name email phone profilePhoto');

  res.status(200).json({
    success: true,
    message: 'Volunteer assigned successfully',
    incident: populated,
  });
});

/**
 * @desc    Get tasks assigned to logged-in volunteer
 * @route   GET /api/incidents/my-tasks
 * @access  Private (Volunteer)
 */
export const getMyTasks = asyncHandler(async (req, res) => {
  const incidents = await Incident.find({ assignedVolunteer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('reportedBy', 'name email phone profilePhoto');

  res.status(200).json({
    success: true,
    count: incidents.length,
    incidents,
  });
});

/**
 * @desc    Accept assigned task
 * @route   PATCH /api/incidents/:id/accept-task
 * @access  Private (Volunteer)
 */
export const acceptTask = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }

  if (incident.assignedVolunteer?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not assigned to this incident');
  }

  if (incident.taskStatus !== 'assigned') {
    res.status(400);
    throw new Error(`Cannot accept task in '${incident.taskStatus}' state`);
  }

  incident.taskStatus = 'accepted';
  await incident.save();

  const populated = await incident
    .populate('reportedBy', 'name email phone profilePhoto')
    .populate('assignedVolunteer', 'name email phone profilePhoto');

  res.status(200).json({
    success: true,
    message: 'Task accepted successfully',
    incident: populated,
  });
});

/**
 * @desc    Update task status (in-progress, completed)
 * @route   PATCH /api/incidents/:id/task-status
 * @access  Private (Volunteer)
 */
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { taskStatus } = req.body;
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }

  if (incident.assignedVolunteer?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not assigned to this incident');
  }

  const validTransitions = {
    accepted: ['in-progress'],
    'in-progress': ['completed'],
  };

  const allowed = validTransitions[incident.taskStatus] || [];
  if (!allowed.includes(taskStatus)) {
    res.status(400);
    throw new Error(`Cannot change task status from '${incident.taskStatus}' to '${taskStatus}'`);
  }

  incident.taskStatus = taskStatus;
  await incident.save();

  const populated = await incident
    .populate('reportedBy', 'name email phone profilePhoto')
    .populate('assignedVolunteer', 'name email phone profilePhoto');

  res.status(200).json({
    success: true,
    message: `Task status updated to ${taskStatus}`,
    incident: populated,
  });
});

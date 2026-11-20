import asyncHandler from 'express-async-handler';
import EmergencyRequest from '../models/EmergencyRequest.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

/**
 * @desc    Create emergency request
 * @route   POST /api/requests
 * @access  Private
 */
export const createEmergencyRequest = asyncHandler(async (req, res) => {
  const { requestType, description, latitude, longitude, address, contactPhone, peopleCount, priority } = req.body;

  const request = await EmergencyRequest.create({
    requestType,
    description,
    priority: priority || 'medium',
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
      address: address || '',
    },
    requestedBy: req.user._id,
    contactPhone,
    peopleCount: peopleCount || 1,
  });

  const populated = await request.populate('requestedBy', 'name email phone');

  const responders = await User.find({ role: { $in: ['coordinator', 'admin'] }, isActive: true }).select('_id').lean();
  await Promise.all(responders.map(({ _id }) => createNotification({
    recipient: _id,
    type: 'emergency_alert',
    title: 'New emergency assistance request',
    message: `${request.requestType} request — ${address || 'Location not provided'} (${request.priority} priority).`,
    relatedId: request._id,
    relatedModel: 'EmergencyRequest',
    createdBy: req.user._id,
    metadata: { priority: request.priority, requestType: request.requestType, address: address || '' },
  })));

  res.status(201).json({
    success: true,
    message: 'Emergency request submitted successfully',
    request: populated,
  });
});

/**
 * @desc    Get user's emergency requests
 * @route   GET /api/requests/my-requests
 * @access  Private
 */
export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await EmergencyRequest.find({ requestedBy: req.user._id })
    .sort({ createdAt: -1 })
    .populate('assignedVolunteer', 'name email phone');

  res.status(200).json({
    success: true,
    count: requests.length,
    requests,
  });
});

/**
 * @desc    Get all emergency requests (for Coordinator / Admin)
 * @route   GET /api/requests
 * @access  Private (Coordinator / Admin)
 */
export const getAllRequests = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.priority) query.priority = req.query.priority;

  const requests = await EmergencyRequest.find(query)
    .sort({ createdAt: -1 })
    .populate('requestedBy', 'name email phone')
    .populate('assignedVolunteer', 'name email phone');

  res.status(200).json({
    success: true,
    count: requests.length,
    requests,
  });
});

/**
 * @desc    Get request by ID
 * @route   GET /api/requests/:id
 * @access  Private
 */
export const getRequestById = asyncHandler(async (req, res) => {
  const request = await EmergencyRequest.findById(req.params.id)
    .populate('requestedBy', 'name email phone')
    .populate('assignedVolunteer', 'name email phone');

  if (!request) {
    res.status(404);
    throw new Error('Emergency request not found');
  }

  res.status(200).json({
    success: true,
    request,
  });
});

/**
 * @desc    Update request priority
 * @route   PATCH /api/requests/:id/priority
 * @access  Private (Coordinator / Admin)
 */
export const updateRequestPriority = asyncHandler(async (req, res) => {
  const { priority } = req.body;
  if (!['critical', 'high', 'medium', 'low'].includes(priority)) {
    res.status(400);
    throw new Error('Invalid priority level');
  }

  const request = await EmergencyRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Emergency request not found');
  }

  request.priority = priority;
  if (request.status === 'submitted') {
    request.status = 'prioritized';
  }
  await request.save();

  res.status(200).json({
    success: true,
    message: `Priority updated to ${priority}`,
    request,
  });
});

/**
 * @desc    Assign volunteer to emergency request
 * @route   PATCH /api/requests/:id/assign
 * @access  Private (Coordinator / Admin)
 */
export const assignVolunteerToRequest = asyncHandler(async (req, res) => {
  const { volunteerId } = req.body;
  const volunteer = await User.findById(volunteerId);

  if (!volunteer || volunteer.role !== 'volunteer') {
    res.status(400);
    throw new Error('Invalid volunteer selected');
  }

  const request = await EmergencyRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Emergency request not found');
  }

  request.assignedVolunteer = volunteerId;
  request.status = 'assigned';
  await request.save();

  // Notify the volunteer about the assignment
  await createNotification({
    recipient: volunteerId,
    type: 'volunteer_assignment',
    title: 'New Emergency Request Assigned',
    message: `You have been assigned to an emergency request (${request.requestType}). Please review and respond promptly.`,
    relatedId: request._id,
    relatedModel: 'EmergencyRequest',
    createdBy: req.user._id,
  });

  const populated = await request
    .populate('requestedBy', 'name email phone')
    .populate('assignedVolunteer', 'name email phone');

  res.status(200).json({
    success: true,
    message: 'Volunteer assigned to emergency request',
    request: populated,
  });
});

/**
 * @desc    Update request status
 * @route   PATCH /api/requests/:id/status
 * @access  Private
 */
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['submitted', 'prioritized', 'assigned', 'in-progress', 'completed', 'closed'];

  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const request = await EmergencyRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Emergency request not found');
  }

  request.status = status;
  if (status === 'closed') {
    request.closedAt = new Date();
  }
  await request.save();

  if (request.requestedBy) {
    await createNotification({
      recipient: request.requestedBy,
      type: 'incident_status',
      title: 'Emergency request status updated',
      message: `Your ${request.requestType} request status is now ${status}.`,
      relatedId: request._id,
      relatedModel: 'EmergencyRequest',
      createdBy: req.user._id,
      metadata: { status, priority: request.priority },
    });
  }

  res.status(200).json({
    success: true,
    message: `Request status updated to ${status}`,
    request,
  });
});

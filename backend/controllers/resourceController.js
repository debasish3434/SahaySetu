import asyncHandler from 'express-async-handler';
import Resource from '../models/Resource.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

const notifyResourceChange = async (resource, actorId, previousStatus = null) => {
  const recipients = await User.find({ role: { $in: ['coordinator', 'admin'] }, isActive: true, _id: { $ne: actorId } }).select('_id').lean();
  await Promise.all(recipients.map(({ _id }) => createNotification({
    recipient: _id,
    type: 'resource_alert',
    title: previousStatus && previousStatus !== resource.status ? 'Resource availability changed' : 'Relief resource updated',
    message: `${resource.name}: ${resource.quantity} ${resource.unit} available (${resource.status}) at ${resource.location}.`,
    relatedId: resource._id,
    relatedModel: 'Resource',
    createdBy: actorId,
    metadata: { status: resource.status, quantity: resource.quantity, previousStatus },
  })));
};

/**
 * @desc    Add relief resource
 * @route   POST /api/resources
 * @access  Private (Coordinator / Admin)
 */
export const addResource = asyncHandler(async (req, res) => {
  const { name, category, quantity, unit, location } = req.body;

  const resource = await Resource.create({
    name,
    category,
    quantity: parseInt(quantity, 10),
    unit: unit || 'items',
    location: location || 'Central Relief Hub',
    updatedBy: req.user._id,
  });

  await notifyResourceChange(resource, req.user._id);

  res.status(201).json({
    success: true,
    message: 'Resource added successfully',
    resource,
  });
});

/**
 * @desc    Get relief resources
 * @route   GET /api/resources
 * @access  Private (Coordinator / Admin)
 */
export const getResources = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.category) query.category = req.query.category;
  if (req.query.status) query.status = req.query.status;

  const resources = await Resource.find(query)
    .sort({ updatedAt: -1 })
    .populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    count: resources.length,
    resources,
  });
});

/**
 * @desc    Update resource quantity & status
 * @route   PUT /api/resources/:id
 * @access  Private (Coordinator / Admin)
 */
export const updateResource = asyncHandler(async (req, res) => {
  const { quantity, status, location, name } = req.body;
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const previousStatus = resource.status;
  if (name !== undefined) resource.name = name;

  if (quantity !== undefined) {
    resource.quantity = Math.max(0, parseInt(quantity, 10));
    if (resource.quantity === 0) resource.status = 'depleted';
    else if (resource.quantity < 10) resource.status = 'low';
    else resource.status = 'available';
  }

  if (status) resource.status = status;
  if (location) resource.location = location;
  resource.updatedBy = req.user._id;

  await resource.save();
  if (previousStatus !== resource.status || quantity !== undefined) await notifyResourceChange(resource, req.user._id, previousStatus);

  res.status(200).json({
    success: true,
    message: 'Resource updated successfully',
    resource,
  });
});

/**
 * @desc    Delete a resource
 * @route   DELETE /api/resources/:id
 * @access  Private (Coordinator / Admin)
 */
export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  await resource.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Resource deleted successfully',
  });
});

/**
 * @desc    Get resource summary stats
 * @route   GET /api/resources/stats
 * @access  Private (Coordinator / Admin)
 */
export const getResourceStats = asyncHandler(async (req, res) => {
  const total = await Resource.countDocuments();
  const available = await Resource.countDocuments({ status: 'available' });
  const low = await Resource.countDocuments({ status: 'low' });
  const depleted = await Resource.countDocuments({ status: 'depleted' });

  res.status(200).json({
    success: true,
    stats: { total, available, low, depleted },
  });
});

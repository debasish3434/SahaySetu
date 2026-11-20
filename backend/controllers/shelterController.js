import asyncHandler from 'express-async-handler';
import Shelter from '../models/Shelter.js';

/**
 * @desc    Register a new shelter
 * @route   POST /api/shelters
 * @access  Private (Coordinator / Admin)
 */
export const registerShelter = asyncHandler(async (req, res) => {
  const { name, address, latitude, longitude, totalCapacity, occupiedCapacity, contactPhone, facilities } = req.body;

  const shelter = await Shelter.create({
    name,
    address,
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    },
    totalCapacity: parseInt(totalCapacity, 10),
    occupiedCapacity: parseInt(occupiedCapacity || 0, 10),
    contactPhone,
    facilities: Array.isArray(facilities) ? facilities : facilities ? facilities.split(',').map((f) => f.trim()) : [],
    registeredBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Shelter registered successfully',
    shelter,
  });
});

/**
 * @desc    Get all shelters
 * @route   GET /api/shelters
 * @access  Private
 */
export const getShelters = asyncHandler(async (req, res) => {
  const shelters = await Shelter.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: shelters.length,
    shelters,
  });
});

/**
 * @desc    Get nearby shelters
 * @route   GET /api/shelters/nearby
 * @access  Private
 */
export const getNearbyShelters = asyncHandler(async (req, res) => {
  const { lat, lng, radius } = req.query;

  if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    res.status(400);
    throw new Error('Latitude (lat) and longitude (lng) are required');
  }

  const searchRadius = parseFloat(radius) || 10000; // 10km default

  const shelters = await Shelter.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: searchRadius,
      },
    },
  });

  res.status(200).json({
    success: true,
    count: shelters.length,
    shelters,
  });
});

/**
 * @desc    Get shelter by ID
 * @route   GET /api/shelters/:id
 * @access  Private
 */
export const getShelterById = asyncHandler(async (req, res) => {
  const shelter = await Shelter.findById(req.params.id);
  if (!shelter) {
    res.status(404);
    throw new Error('Shelter not found');
  }

  res.status(200).json({
    success: true,
    shelter,
  });
});

/**
 * @desc    Update shelter capacity & status
 * @route   PUT /api/shelters/:id/capacity
 * @access  Private (Coordinator / Admin)
 */
export const updateShelterCapacity = asyncHandler(async (req, res) => {
  const { totalCapacity, occupiedCapacity, status } = req.body;
  const shelter = await Shelter.findById(req.params.id);

  if (!shelter) {
    res.status(404);
    throw new Error('Shelter not found');
  }

  if (totalCapacity !== undefined) shelter.totalCapacity = Math.max(0, parseInt(totalCapacity, 10));
  if (occupiedCapacity !== undefined) shelter.occupiedCapacity = Math.max(0, parseInt(occupiedCapacity, 10));

  if (shelter.occupiedCapacity >= shelter.totalCapacity && shelter.totalCapacity > 0) {
    shelter.status = 'full';
  } else if (status) {
    shelter.status = status;
  }

  await shelter.save();

  res.status(200).json({
    success: true,
    message: 'Shelter capacity updated successfully',
    shelter,
  });
});

import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Incident from '../models/Incident.js';
import { createNotification } from './notificationController.js';

/**
 * @desc    Apply to become a volunteer
 * @route   POST /api/volunteers/apply
 * @access  Private
 */
export const applyAsVolunteer = asyncHandler(async (req, res) => {
  const { skills, availability, location } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'citizen') {
    user.role = 'volunteer';
  }

  const parsedSkills = Array.isArray(skills)
    ? skills
    : typeof skills === 'string'
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  user.volunteerProfile = {
    skills: parsedSkills,
    availability: availability || 'anytime',
    location: location || '',
    verificationStatus: 'pending',
    verifiedBy: null,
    verifiedAt: null,
  };
  user.approvalStatus = 'pending';
  user.approvedBy = undefined;
  user.approvedAt = undefined;
  user.rejectionReason = undefined;

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    message: 'Volunteer application submitted successfully',
    user: updatedUser,
  });
});

/**
 * @desc    Get pending volunteer applications
 * @route   GET /api/volunteers/pending
 * @access  Private (Coordinator / Admin)
 */
export const getPendingVolunteers = asyncHandler(async (req, res) => {
  const volunteers = await User.find({
    role: 'volunteer',
    'volunteerProfile.verificationStatus': 'pending',
  }).select('-password');

  res.status(200).json({
    success: true,
    count: volunteers.length,
    volunteers,
  });
});

/**
 * @desc    Approve or reject a volunteer application
 * @route   PATCH /api/volunteers/:userId/verify
 * @access  Private (Coordinator / Admin)
 */
export const verifyVolunteer = asyncHandler(async (req, res) => {
  const { decision } = req.body;
  const { userId } = req.params;

  if (!['verified', 'rejected'].includes(decision)) {
    res.status(400);
    throw new Error('Decision must be either "verified" or "rejected"');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.volunteerProfile = user.volunteerProfile || {};
  user.volunteerProfile.verificationStatus = decision;
  user.volunteerProfile.verifiedBy = req.user._id;
  user.volunteerProfile.verifiedAt = new Date();
  user.approvalStatus = decision === 'verified' ? 'approved' : 'rejected';
  user.approvedBy = req.user._id;
  user.approvedAt = new Date();
  user.isActive = decision === 'verified';

  const updatedUser = await user.save();

  await createNotification({
    recipient: user._id,
    type: 'incident_status',
    title: `Volunteer application ${decision}`,
    message: `Your volunteer verification status is now ${decision}.`,
    createdBy: req.user._id,
    metadata: { verificationStatus: decision },
  });

  res.status(200).json({
    success: true,
    message: `Volunteer application has been ${decision}`,
    user: updatedUser,
  });
});

/**
 * @desc    Get list of verified volunteers (for incident/request assignment)
 * @route   GET /api/volunteers/verified
 * @access  Private (Coordinator / Admin)
 */
export const getVerifiedVolunteers = asyncHandler(async (req, res) => {
  const volunteers = await User.find({
    role: 'volunteer',
    'volunteerProfile.verificationStatus': 'verified',
  }).select('name email phone profilePhoto volunteerProfile');

  res.status(200).json({
    success: true,
    count: volunteers.length,
    volunteers,
  });
});

/**
 * @desc    Get all volunteers with their verification status
 * @route   GET /api/volunteers/all
 * @access  Private (Coordinator / Admin)
 */
export const getAllVolunteers = asyncHandler(async (req, res) => {
  const query = { role: 'volunteer' };
  if (req.query.status) {
    query['volunteerProfile.verificationStatus'] = req.query.status;
  }

  const volunteers = await User.find(query).select('-password');

  res.status(200).json({
    success: true,
    count: volunteers.length,
    volunteers,
  });
});

/**
 * @desc    Get volunteer's task history (completed tasks)
 * @route   GET /api/volunteers/history
 * @access  Private (Volunteer)
 */
export const getVolunteerHistory = asyncHandler(async (req, res) => {
  const incidents = await Incident.find({
    assignedVolunteer: req.user._id,
    taskStatus: { $in: ['completed', 'in-progress', 'accepted', 'assigned'] },
  })
    .sort({ updatedAt: -1 })
    .populate('reportedBy', 'name email phone');

  const stats = {
    total: incidents.length,
    completed: incidents.filter((i) => i.taskStatus === 'completed').length,
    inProgress: incidents.filter((i) => i.taskStatus === 'in-progress').length,
    accepted: incidents.filter((i) => i.taskStatus === 'accepted').length,
    assigned: incidents.filter((i) => i.taskStatus === 'assigned').length,
  };

  res.status(200).json({
    success: true,
    count: incidents.length,
    stats,
    incidents,
  });
});

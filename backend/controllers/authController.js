import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import generateToken from '../utils/generateToken.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';

const logActivity = (action, actor, values = {}) => ActivityLog.create({ action, actor, ...values });

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const requestedRole = String(req.body.role || 'citizen').toLowerCase();
  const publicRoles = ['citizen', 'volunteer', 'coordinator'];
  if (!publicRoles.includes(requestedRole)) {
    res.status(403);
    throw new Error('Public registration is limited to Citizen, Volunteer, or Coordinator');
  }
  const finalEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: finalEmail });
  if (existingUser) {
    res.status(409);
    throw new Error('Unable to register with these details. If you already have an account, sign in or reset your password.');
  }

  const needsApproval = requestedRole === 'volunteer' || requestedRole === 'coordinator';
  const user = await User.create({
    name, email: finalEmail, password, phone,
    role: requestedRole,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    approvalStatus: needsApproval ? 'pending' : 'approved',
    ...(requestedRole === 'volunteer' && { volunteerProfile: { verificationStatus: 'pending' } }),
  });
  if (needsApproval) {
    return res.status(201).json({
      success: true,
      message: 'Application submitted. Wait for Super Admin approval before signing in.',
      requiresApproval: true,
      approvalStatus: user.approvalStatus,
      user,
    });
  }
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  const token = generateToken(user._id, user.role, user.sessionVersion || 0);
  res.status(201).json({ success: true, message: 'Registration successful.', token, user, requiresApproval: false });
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const identity = String(email || '').trim();

  // Explicitly select password since schema excludes it by default
  const user = await User.findOne(identity.includes('@')
    ? { email: identity.toLowerCase() }
    : { administratorId: identity.toUpperCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw Object.assign(new Error('Your account is currently inactive. Please contact the administrator.'), { code: 'ACCOUNT_DEACTIVATED' });
  }
  if (user.invitationStatus === 'pending' && !user.mustChangePassword) {
    res.status(403);
    throw Object.assign(new Error('Activate your administrator invitation and set a new password before signing in.'), { code: 'ADMIN_ACTIVATION_REQUIRED' });
  }
  if (user.mustChangePassword && user.role === 'admin') {
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = generateToken(user._id, user.role, user.sessionVersion || 0);
    return res.status(200).json({
      success: true,
      message: 'Sign-in successful. Set a new password to finish activating your administrator account.',
      token,
      user,
      passwordChangeRequired: true,
    });
  }
  if (['volunteer', 'coordinator'].includes(user.role) && user.approvalStatus !== 'approved') {
    res.status(403);
    const pending = user.approvalStatus === 'pending';
    throw Object.assign(new Error(pending
      ? 'Your application has been submitted successfully. Please wait for administrator approval.'
      : 'Your application has been rejected. Please contact the administrator for further information.'), {
      code: pending ? 'APPLICATION_PENDING' : 'APPLICATION_REJECTED',
    });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role, user.sessionVersion || 0);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user,
  });
});

/**
 * @desc    Log out (client clears JWT; endpoint provided for Review 1 completeness)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

/**
 * @desc    Request a password reset token (emailed in production; returned in dev for testing)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Respond identically whether or not user exists to avoid leaking which emails are registered
  const genericResponse = {
    success: true,
    message: 'If an account exists for this email, a password reset link has been sent.',
  };

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password/${encodeURIComponent(resetToken)}`;
  try {
    await sendPasswordResetEmail({ name: user.name, email: user.email, resetUrl });
  } catch {
    // Do not log the address or reset URL/token. Keep the response indistinguishable
    // from an unknown account to avoid account enumeration.
    console.warn('[Auth] Password reset email delivery failed. Check email provider configuration.');
  }
  res.status(200).json(genericResponse);
});

/**
 * @desc    Reset password using a valid reset token
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    res.status(400);
    throw new Error('Password reset token is invalid or has expired');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  await user.save();

  const token = generateToken(user._id, user.role, user.sessionVersion || 0);

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You are now logged in.',
    token,
    user,
  });
});

/**
 * @desc    Change password for logged-in user
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!user || !(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  const firstLoginChange = user.role === 'admin' && user.mustChangePassword;
  user.password = newPassword;
  if (firstLoginChange) {
    user.mustChangePassword = false;
    user.invitationStatus = 'accepted';
    user.sessionVersion = (user.sessionVersion || 0) + 1;
  }
  await user.save();

  if (firstLoginChange) {
    const token = generateToken(user._id, user.role, user.sessionVersion || 0);
    return res.status(200).json({ success: true, message: 'Password updated. Your administrator account is ready.', token, user });
  }

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

/** One-time owner initialization. It will not promote an existing account implicitly. */
export const bootstrapSuperAdmin = asyncHandler(async (req, res) => {
  const configuredEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.SUPER_ADMIN_INITIAL_PASSWORD;
  const { email, password, name, phone } = req.body;
  if (!configuredEmail || !configuredPassword) {
    res.status(503);
    throw new Error('Super Admin initialization is not configured on this server');
  }
  await User.init();
  if (String(email || '').trim().toLowerCase() !== configuredEmail || password !== configuredPassword) {
    res.status(401);
    throw new Error('Initialization credentials do not match the server configuration');
  }
  if (await User.exists({ isSuperAdmin: true })) {
    res.status(409);
    throw new Error('The Super Admin has already been initialized');
  }
  if (await User.exists({ email: configuredEmail })) {
    res.status(409);
    throw new Error('This email already has an account. Back up the database and use the documented owner migration process.');
  }
  const user = await User.create({
    name: name || 'SahaySetu Super Admin',
    email: configuredEmail,
    password: configuredPassword,
    phone,
    role: 'admin',
    approvalStatus: 'approved',
    isActive: true,
    isSuperAdmin: true,
    approvedAt: new Date(),
  });
  await logActivity('super_admin_initialized', user._id, { target: user._id, targetEmail: user.email });
  res.status(201).json({ success: true, message: 'Super Admin initialized. Sign in with the configured email and password.' });
});


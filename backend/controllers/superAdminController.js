import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { createNotification } from './notificationController.js';

const logActivity = (action, actor, values = {}) => ActivityLog.create({ action, actor, ...values });
export const ADMIN_PERMISSION_OPTIONS = ['volunteer_management', 'incident_management', 'request_management', 'shelter_management', 'resource_management', 'analytics', 'system_settings', 'announcements'];

export const getSuperAdminOverview = asyncHandler(async (req, res) => {
  const [total, citizens, volunteers, coordinators, admins, activeUsers, inactiveUsers, pendingVolunteers, pendingCoordinators, recentActivities] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'citizen' }),
    User.countDocuments({ role: 'volunteer' }),
    User.countDocuments({ role: 'coordinator' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
    User.countDocuments({ role: 'volunteer', approvalStatus: 'pending' }),
    User.countDocuments({ role: 'coordinator', approvalStatus: 'pending' }),
    ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('actor', 'name email isSuperAdmin').lean(),
  ]);
  res.json({ success: true, overview: { total, citizens, volunteers, coordinators, admins, activeUsers, inactiveUsers, pendingVolunteers, pendingCoordinators }, recentActivities });
});

export const listApplications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const query = { role: { $in: ['volunteer', 'coordinator'] } };
  if (['volunteer', 'coordinator'].includes(req.query.role)) query.role = req.query.role;
  if (['pending', 'approved', 'rejected'].includes(req.query.status)) query.approvalStatus = req.query.status;
  else query.approvalStatus = { $in: ['pending', 'approved', 'rejected'] };
  if (req.query.search) {
    const search = String(req.query.search).trim().slice(0, 80);
    query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  }
  const [applications, total] = await Promise.all([
    User.find(query).select('-password -resetPasswordToken -resetPasswordExpire').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('approvedBy', 'name email').lean(),
    User.countDocuments(query),
  ]);
  res.json({ success: true, applications, total, page, pages: Math.ceil(total / limit) });
});

export const decideApplication = asyncHandler(async (req, res) => {
  const { decision, rejectionReason = '' } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    res.status(400); throw new Error('Decision must be approved or rejected');
  }
  if (decision === 'rejected' && String(rejectionReason).length > 500) {
    res.status(400); throw new Error('Rejection reason cannot exceed 500 characters');
  }
  const applicant = await User.findById(req.params.userId);
  if (!applicant || !['volunteer', 'coordinator'].includes(applicant.role)) {
    res.status(404); throw new Error('Volunteer or coordinator application not found');
  }
  if (applicant.approvalStatus !== 'pending') {
    res.status(409); throw new Error('This application has already been reviewed');
  }
  applicant.emailVerified = true;
  applicant.approvalStatus = decision;
  applicant.approvedBy = req.user._id;
  applicant.approvedAt = new Date();
  applicant.rejectionReason = decision === 'rejected' ? String(rejectionReason).trim() : undefined;
  applicant.isActive = decision === 'approved';
  if (applicant.role === 'volunteer') {
    applicant.volunteerProfile = applicant.volunteerProfile || {};
    applicant.volunteerProfile.verificationStatus = decision === 'approved' ? 'verified' : 'rejected';
    applicant.volunteerProfile.verifiedBy = req.user._id;
    applicant.volunteerProfile.verifiedAt = new Date();
  }
  await applicant.save();
  const action = `${applicant.role}_${decision}`;
  await logActivity(action, req.user._id, { target: applicant._id, targetEmail: applicant.email, details: rejectionReason || '' });
  await createNotification({ recipient: applicant._id, type: 'announcement', title: decision === 'approved' ? 'Your application was approved' : 'Your application was not approved', message: decision === 'approved' ? 'Your account has been approved. You can now access your dashboard.' : 'Your application has been rejected. Please contact the administrator for further information.', createdBy: req.user._id, metadata: { approvalStatus: decision } });
  res.json({ success: true, message: `Application ${decision}`, user: applicant });
});

export const listAdministrators = asyncHandler(async (req, res) => {
  const query = { role: 'admin' };
  if (req.query.status === 'active') query.isActive = true;
  if (req.query.status === 'inactive') query.isActive = false;
  if (req.query.search) {
    const search = String(req.query.search).trim().slice(0, 80);
    query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  }
  const users = await User.find(query).select('-password -resetPasswordToken -resetPasswordExpire').sort({ isSuperAdmin: -1, name: 1 }).populate('invitedBy', 'name email').lean();
  res.json({ success: true, administrators: users });
});

export const inviteAdministrator = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const initialPassword = String(req.body.initialPassword || '');
  const confirmPassword = String(req.body.confirmPassword || '');
  const permissions = req.body.permissions;
  const accountActive = req.body.accountStatus === 'active';
  if (name.length < 2 || name.length > 60 || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400); throw new Error('Enter a valid full name and email address');
  }
  if (initialPassword.length < 8 || !/\d/.test(initialPassword)) { res.status(400); throw new Error('Initial password must be at least 8 characters and contain a number'); }
  if (initialPassword !== confirmPassword) { res.status(400); throw new Error('Initial password and confirmation do not match'); }
  if (!Array.isArray(permissions) || permissions.some((permission) => !ADMIN_PERMISSION_OPTIONS.includes(permission))) { res.status(400); throw new Error('Select valid administrator permissions'); }
  if (!['active', 'inactive'].includes(req.body.accountStatus)) { res.status(400); throw new Error('Account status must be active or inactive'); }
  let invitedUser = await User.findOne({ email }).select('+password');
  if (invitedUser && !(invitedUser.role === 'admin' && !invitedUser.isSuperAdmin && invitedUser.mustChangePassword)) {
    res.status(409); throw new Error('An account already exists for this email');
  }
  let administratorId = invitedUser?.administratorId;
  if (!administratorId) {
    for (let attempt = 0; attempt < 8 && !administratorId; attempt += 1) {
      const sequence = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
      const candidate = `ADM-${new Date().getFullYear()}-${sequence}`;
      if (!await User.exists({ administratorId: candidate })) administratorId = candidate;
    }
    if (!administratorId) { res.status(503); throw new Error('Could not allocate an administrator ID. Please retry.'); }
  }
  if (!invitedUser) {
    invitedUser = await User.create({
      name, email, password: initialPassword, role: 'admin', isSuperAdmin: false,
      administratorId, adminPermissions: permissions, mustChangePassword: true,
      invitationStatus: 'accepted', emailVerified: true, isActive: accountActive,
      approvalStatus: 'approved', invitedBy: req.user._id,
    });
  } else {
    invitedUser.name = name;
    invitedUser.password = initialPassword;
    invitedUser.adminPermissions = permissions;
    invitedUser.mustChangePassword = true;
    invitedUser.invitationStatus = 'accepted';
    invitedUser.emailVerified = true;
    invitedUser.isActive = accountActive;
    invitedUser.invitedBy = req.user._id;
    await invitedUser.save();
  }
  await logActivity('admin_created', req.user._id, { target: invitedUser._id, targetEmail: email, details: `${administratorId}; permissions=${permissions.join(',')}; active=${accountActive}; first-login password change required` });
  res.status(201).json({ success: true, message: 'Administrator account created. Sign in with the generated Administrator ID and initial password, then set a new password at first login.', administratorId, email, mustChangePassword: true });
});

export const resetAdministratorCredentials = asyncHandler(async (req, res) => {
  const administrator = await User.findById(req.params.userId).select('+password');
  if (!administrator || administrator.role !== 'admin') { res.status(404); throw new Error('Administrator not found'); }
  if (administrator.isSuperAdmin) { res.status(403); throw new Error('Super Admin credentials cannot be reset here'); }
  const initialPassword = String(req.body.initialPassword || '');
  const confirmPassword = String(req.body.confirmPassword || '');
  if (initialPassword.length < 8 || !/\d/.test(initialPassword)) { res.status(400); throw new Error('Initial password must be at least 8 characters and contain a number'); }
  if (initialPassword !== confirmPassword) { res.status(400); throw new Error('Initial password and confirmation do not match'); }

  if (!administrator.administratorId) {
    for (let attempt = 0; attempt < 8 && !administrator.administratorId; attempt += 1) {
      const sequence = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
      const candidate = `ADM-${new Date().getFullYear()}-${sequence}`;
      if (!await User.exists({ administratorId: candidate })) administrator.administratorId = candidate;
    }
    if (!administrator.administratorId) { res.status(503); throw new Error('Could not allocate an administrator ID. Please retry.'); }
  }

  administrator.password = initialPassword;
  administrator.mustChangePassword = true;
  administrator.invitationStatus = 'accepted';
  administrator.emailVerified = true;
  administrator.sessionVersion = (administrator.sessionVersion || 0) + 1;
  await administrator.save();
  await logActivity('admin_credentials_reset', req.user._id, { target: administrator._id, targetEmail: administrator.email, details: `Administrator ${administrator.administratorId}; first-login password change required` });
  res.json({ success: true, message: administrator.isActive ? 'Credentials reset. Sign in with the Administrator ID and new initial password.' : 'Credentials reset. Activate the account before the administrator signs in.', administratorId: administrator.administratorId, email: administrator.email, isActive: administrator.isActive, mustChangePassword: true });
});

export const setAdministratorActive = asyncHandler(async (req, res) => {
  const administrator = await User.findById(req.params.userId);
  if (!administrator || administrator.role !== 'admin') { res.status(404); throw new Error('Administrator not found'); }
  if (administrator.isSuperAdmin) { res.status(403); throw new Error('The Super Admin account cannot be deactivated'); }
  if (administrator._id.equals(req.user._id)) { res.status(400); throw new Error('You cannot deactivate your own account'); }
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') { res.status(400); throw new Error('isActive must be true or false'); }
  administrator.isActive = isActive;
  administrator.sessionVersion = (administrator.sessionVersion || 0) + 1;
  await administrator.save();
  await logActivity(isActive ? 'admin_activated' : 'admin_deactivated', req.user._id, { target: administrator._id, targetEmail: administrator.email });
  res.json({ success: true, administrator });
});

export const updateAdministratorPermissions = asyncHandler(async (req, res) => {
  const administrator = await User.findById(req.params.userId);
  if (!administrator || administrator.role !== 'admin') { res.status(404); throw new Error('Administrator not found'); }
  if (administrator.isSuperAdmin) { res.status(403); throw new Error('Super Admin permissions cannot be changed here'); }
  if (administrator._id.equals(req.user._id)) { res.status(403); throw new Error('You cannot change your own permissions'); }
  const { permissions } = req.body;
  if (!Array.isArray(permissions) || permissions.some((permission) => !ADMIN_PERMISSION_OPTIONS.includes(permission))) { res.status(400); throw new Error('Select valid administrator permissions'); }
  administrator.adminPermissions = [...new Set(permissions)];
  administrator.sessionVersion = (administrator.sessionVersion || 0) + 1;
  await administrator.save();
  await logActivity('admin_permissions_updated', req.user._id, { target: administrator._id, targetEmail: administrator.email, details: administrator.adminPermissions.join(', ') || 'No module permissions' });
  res.json({ success: true, administrator });
});

export const revokeAdministratorAccess = asyncHandler(async (req, res) => {
  const administrator = await User.findById(req.params.userId);
  if (!administrator || administrator.role !== 'admin') { res.status(404); throw new Error('Administrator not found'); }
  if (administrator.isSuperAdmin) { res.status(403); throw new Error('The Super Admin account cannot be revoked'); }
  administrator.isActive = false;
  administrator.invitationStatus = 'revoked';
  administrator.sessionVersion = (administrator.sessionVersion || 0) + 1;
  await administrator.save();
  await logActivity('admin_access_revoked', req.user._id, { target: administrator._id, targetEmail: administrator.email, details: 'Administrator access revoked by Super Admin' });
  res.json({ success: true, administrator });
});

export const listActivityLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
  const [activities, total] = await Promise.all([
    ActivityLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('actor', 'name email isSuperAdmin').lean(),
    ActivityLog.countDocuments(),
  ]);
  res.json({ success: true, activities, total, page, pages: Math.ceil(total / limit) });
});


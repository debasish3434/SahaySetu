import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * protect
 * Verifies the JWT, loads the user, and checks isActive.
 * Attaches req.user for downstream handlers.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error('Account has been deactivated. Contact support.');
    }

    if ((decoded.sessionVersion ?? 0) !== (user.sessionVersion || 0)) {
      res.status(401);
      throw new Error('Session has expired. Please sign in again.');
    }

    const path = req.originalUrl.split('?')[0];
    if (user.mustChangePassword && !['/api/auth/me', '/api/auth/change-password', '/api/auth/logout'].includes(path)) {
      res.status(403);
      throw Object.assign(new Error('Set a new password to finish activating your administrator account.'), { code: 'PASSWORD_CHANGE_REQUIRED' });
    }

    if (user.role === 'admin' && !user.isSuperAdmin) {
      const dashboardPermissions = ['volunteer_management', 'incident_management', 'request_management', 'shelter_management', 'resource_management'];
      if (path === '/api/admin/stats') {
        if (!dashboardPermissions.some((permission) => user.adminPermissions?.includes(permission))) {
          res.status(403);
          throw new Error('Your administrator account does not have dashboard module access.');
        }
      }
      const permissionByPath = [
        ['/api/admin/volunteers', 'volunteer_management'],
        ['/api/volunteers', 'volunteer_management'],
        ['/api/incidents', 'incident_management'],
        ['/api/requests', 'request_management'],
        ['/api/shelters', 'shelter_management'],
        ['/api/resources', 'resource_management'],
        ['/api/analytics', 'analytics'],
        ['/api/settings', 'system_settings'],
      ];
      let requiredPermission = path === '/api/admin/stats' ? null : permissionByPath.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1];
      if (path.startsWith('/api/notifications/announcement')) requiredPermission = 'announcements';
      if (requiredPermission && !user.adminPermissions?.includes(requiredPermission)) {
        res.status(403);
        throw new Error(`Your administrator account does not have the '${requiredPermission}' permission.`);
      }
    }

    req.user = user;
    next();
  } catch (error) {
    const jwtErrors = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'];
    if (jwtErrors.includes(error.name)) {
      res.status(401);
      throw new Error('Not authorized, token failed or expired');
    }
    throw error;
  }
});

/**
 * authorize(...roles)
 * Restricts a route to specific roles.
 * Usage: authorize('admin', 'coordinator')
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user?.role}' is not permitted to perform this action`);
  }
  // Authorization uses the freshly loaded database record, so approval and
  // activation changes immediately affect existing JWT sessions.
  if (['volunteer', 'coordinator'].includes(req.user.role) && req.user.approvalStatus !== 'approved') {
    res.status(403);
    const pending = req.user.approvalStatus !== 'rejected';
    throw Object.assign(new Error(pending ? 'Your application has been submitted successfully. Please wait for administrator approval.' : 'Your application has been rejected. Please contact the administrator for further information.'), { code: pending ? 'APPLICATION_PENDING' : 'APPLICATION_REJECTED' });
  }
  next();
};

/**
 * requireApproved
 * Blocks volunteers and coordinators who have not yet been approved by the Super Admin.
 * Citizens are always 'not_required' — they pass through immediately.
 * Admins are always 'approved'.
 *
 * Usage: router.use(protect, requireApproved)
 */
export const requireApproved = (req, res, next) => {
  const { approvalStatus, role } = req.user;

  // Citizens and admins are never blocked by this middleware
  if (role === 'citizen' || role === 'admin') return next();

  if (approvalStatus === 'pending') {
    res.status(403);
    throw new Error('Your application is pending approval by the Super Administrator.');
  }

  if (approvalStatus === 'rejected') {
    res.status(403);
    throw new Error('Your application has been rejected. Contact the administrator for more information.');
  }

  // approvalStatus === 'approved' or 'not_required' → allow
  next();
};

/**
 * requireSuperAdmin
 * Restricts an endpoint to the one Super Admin account.
 * Secondary admins are explicitly blocked.
 *
 * Usage: router.use(protect, requireSuperAdmin)
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || !req.user.isSuperAdmin) {
    res.status(403);
    throw new Error('This action requires Super Administrator privileges.');
  }
  next();
};

export const authorizeSuperAdmin = requireSuperAdmin;

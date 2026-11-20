import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import PageLoader from '../common/PageLoader.jsx';

/**
 * Guards nested routes so only authenticated users can access them.
 * Optionally restricts by role (role-based access control).
 * Redirects unauthenticated users to /login, preserving the intended destination.
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Verifying your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role === 'admin' && user.mustChangePassword && location.pathname !== '/first-login-password') {
    return <Navigate to="/first-login-password" replace />;
  }
  if (location.pathname === '/first-login-password' && !user?.mustChangePassword) {
    return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname !== '/application-status' && (user?.role === 'volunteer' || user?.role === 'coordinator')) {
    if (user.approvalStatus === 'pending') return <Navigate to="/application-status" replace state={{ status: 'pending' }} />;
    if (user.approvalStatus === 'rejected') return <Navigate to="/application-status" replace state={{ status: 'rejected' }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user?.role === 'admin' && !user?.isSuperAdmin) {
    const path = location.pathname;
    const permissionRoutes = [
      ['/admin/volunteers', 'volunteer_management'],
      ['/volunteer/verify', 'volunteer_management'], ['/admin/incidents', 'incident_management'],
      ['/incident-management', 'incident_management'], ['/incidents/nearby', 'incident_management'],
      ['/emergency-requests', 'request_management'], ['/emergency-request', 'request_management'],
      ['/shelters/register', 'shelter_management'], ['/shelters/manage', 'shelter_management'],
      ['/shelters', 'shelter_management'], ['/resources', 'resource_management'],
      ['/analytics', 'analytics'], ['/admin/settings', 'system_settings'],
      ['/admin/announcements', 'announcements'],
    ];
    const required = permissionRoutes.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1];
    if (path.startsWith('/admin/super-admin') || (required && !user.adminPermissions?.includes(required))) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import PageLoader from '../common/PageLoader.jsx';

/**
 * Prevents already-authenticated users from seeing auth pages (login/register)
 * by redirecting them straight to the dashboard.
 */
const GuestRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default GuestRoute;

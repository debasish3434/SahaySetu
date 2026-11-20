import { useAuth } from '../hooks/useAuth.js';
import CitizenDashboard from './dashboards/CitizenDashboard.jsx';
import VolunteerDashboard from './dashboards/VolunteerDashboard.jsx';
import CoordinatorDashboard from './dashboards/CoordinatorDashboard.jsx';
import AdminDashboard from './dashboards/AdminDashboard.jsx';
import PageLoader from '../components/common/PageLoader.jsx';

const DASHBOARD_MAP = {
  citizen:     CitizenDashboard,
  volunteer:   VolunteerDashboard,
  coordinator: CoordinatorDashboard,
  admin:       AdminDashboard,
};

const Dashboard = () => {
  const { user, loading } = useAuth();

  // Wait until auth is fully resolved
  if (loading || !user) return <PageLoader label="Loading your dashboard…" />;

  const role = user.role?.toLowerCase();
  const DashboardComponent = DASHBOARD_MAP[role];

  // Unknown / unsupported role — show citizen dashboard as safe default
  if (!DashboardComponent) {
    console.warn(`Unknown role "${role}" — falling back to CitizenDashboard`);
    return <CitizenDashboard />;
  }

  return <DashboardComponent />;
};

export default Dashboard;

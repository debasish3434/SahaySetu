import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LuClipboardList, LuCircleAlert, LuHouse, LuPackage, LuUserCheck,
  LuShieldAlert, LuTrendingUp, LuCircleCheckBig
} from 'react-icons/lu';
import { useAuth } from '../../hooks/useAuth.js';
import PageLoader from '../../components/common/PageLoader.jsx';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import MetricCard from '../../components/common/MetricCard.jsx';

const ADMIN_MODULES = [
  ['volunteer_management', 'Volunteer management', '/admin/volunteers', LuUserCheck],
  ['incident_management', 'Incident management', '/admin/incidents', LuClipboardList],
  ['request_management', 'Emergency requests', '/emergency-requests', LuCircleAlert],
  ['shelter_management', 'Shelters', '/shelters', LuHouse],
  ['resource_management', 'Relief resources', '/resources', LuPackage],
  ['analytics', 'Analytics', '/analytics', LuTrendingUp],
  ['system_settings', 'System settings', '/admin/settings', LuShieldAlert],
];

const StatCard = ({ icon: Icon, label, value, to, color = 'brand' }) => (
  <MetricCard icon={Icon} label={label} value={value} to={to} tone={{ brand: 'navy', ink: 'slate', success: 'green', accent: 'blue', warning: 'amber', danger: 'red' }[color] || 'navy'} />
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasDashboardAccess = user?.isSuperAdmin || ['volunteer_management', 'incident_management', 'request_management', 'shelter_management', 'resource_management'].some(permission => user?.adminPermissions?.includes(permission));
  const can = (permission) => user?.isSuperAdmin || user?.adminPermissions?.includes(permission);
  const availableModules = ADMIN_MODULES.filter(([permission]) => can(permission));

  useEffect(() => {
    if (!hasDashboardAccess) { setLoading(false); return undefined; }
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data.stats);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load administrator dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [hasDashboardAccess]);

  if (loading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <PageHeader eyebrow={user?.isSuperAdmin ? 'Owner workspace' : 'Operations workspace'} title={`Welcome, ${user?.name?.split(' ')[0] || 'Administrator'}`} description="Your permitted modules and live operations overview." />

      <section className="card border-brand-200 bg-gradient-to-r from-brand-900 to-brand-800 text-white">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">Workspace access</p><h2 className="mt-1 text-lg font-semibold text-white">{user?.isSuperAdmin ? 'Super Admin · Platform owner' : 'Secondary Administrator'}</h2><p className="mt-1 text-sm text-blue-100/75">{user?.isSuperAdmin ? 'You have full platform access.' : `${availableModules.length} module${availableModules.length === 1 ? '' : 's'} granted by the Super Admin.`}</p></div>
          <div className="flex flex-wrap gap-2">{availableModules.map(([permission, label]) => <span key={permission} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">{label}</span>)}</div>
        </div>
      </section>

      {!hasDashboardAccess && <section className="card"><h2 className="text-lg font-semibold">Your workspace is ready</h2><p className="mt-1 text-sm text-ink-500">Dashboard summaries are not included in your current permissions. Open one of your assigned modules from the navigation.</p></section>}

      {availableModules.length > 0 && <section><h2 className="section-label">Your modules</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{availableModules.map(([permission, label, path, Icon]) => <Link key={permission} to={path} className="group flex items-center gap-3 rounded-2xl border border-surface-200 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent-200 hover:shadow-card-hover"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><Icon size={19} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-ink-800">{label}</strong><span className="text-xs text-ink-500">Open workspace</span></span><LuTrendingUp size={15} className="text-ink-300 transition-colors group-hover:text-accent-600" /></Link>)}</div></section>}

      {/* Incidents Section */}
      {can('incident_management') && <div>
        <h2 className="text-sm font-semibold text-ink-500 uppercase mb-3 flex items-center gap-2"><LuClipboardList size={14} /> Incidents</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={LuClipboardList} label="Total" value={stats?.incidents?.total} to="/admin/incidents" borderColor="border-ink-400" color="ink" />
          <StatCard icon={LuCircleAlert} label="Reported" value={stats?.incidents?.reported} to="/admin/incidents?status=reported" borderColor="border-warning-500" color="warning" />
          <StatCard icon={LuUserCheck} label="Verified" value={stats?.incidents?.verified} to="/admin/incidents?status=verified" borderColor="border-accent-500" color="accent" />
          <StatCard icon={LuTrendingUp} label="In Progress" value={stats?.incidents?.inProgress} to="/admin/incidents?status=in-progress" borderColor="border-brand-500" color="brand" />
          <StatCard icon={LuCircleCheckBig} label="Resolved" value={stats?.incidents?.resolved} to="/admin/incidents?status=resolved" borderColor="border-success-500" color="success" />
          <StatCard icon={LuCircleAlert} label="Rejected" value={stats?.incidents?.rejected} to="/admin/incidents?status=rejected" borderColor="border-danger-500" color="danger" />
        </div>
      </div>}

      {/* Requests Section */}
      {can('request_management') && <div>
        <h2 className="text-sm font-semibold text-ink-500 uppercase mb-3 flex items-center gap-2"><LuCircleAlert size={14} /> Emergency Requests</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={LuCircleAlert} label="Total Requests" value={stats?.requests?.total} borderColor="border-ink-400" color="ink" />
          <StatCard icon={LuCircleAlert} label="Open Requests" value={stats?.requests?.open} borderColor="border-warning-500" color="warning" />
          <StatCard icon={LuCircleAlert} label="Critical" value={stats?.requests?.critical} borderColor="border-danger-500" color="danger" />
          <StatCard icon={LuCircleCheckBig} label="Closed" value={stats?.requests?.closed} borderColor="border-success-500" color="success" />
        </div>
      </div>}

      {/* Shelters + Resources */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {can('shelter_management') && <div>
          <h2 className="text-sm font-semibold text-ink-500 uppercase mb-3 flex items-center gap-2"><LuHouse size={14} /> Shelters</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={LuHouse} label="Total" value={stats?.shelters?.total} to="/shelters" borderColor="border-ink-400" color="ink" />
            <StatCard icon={LuHouse} label="Open" value={stats?.shelters?.open} to="/shelters" borderColor="border-success-500" color="success" />
            <StatCard icon={LuHouse} label="Full" value={stats?.shelters?.full} to="/shelters" borderColor="border-danger-500" color="danger" />
          </div>
        </div>}
        {can('resource_management') && <div>
          <h2 className="text-sm font-semibold text-ink-500 uppercase mb-3 flex items-center gap-2"><LuPackage size={14} /> Resources</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={LuPackage} label="Total" value={stats?.resources?.total} to="/resources" borderColor="border-ink-400" color="ink" />
            <StatCard icon={LuPackage} label="Low Stock" value={stats?.resources?.low} to="/resources" borderColor="border-warning-500" color="warning" />
            <StatCard icon={LuPackage} label="Depleted" value={stats?.resources?.depleted} to="/resources" borderColor="border-danger-500" color="danger" />
          </div>
        </div>}
      </div>
    </motion.div>
  );
};

export default AdminDashboard;

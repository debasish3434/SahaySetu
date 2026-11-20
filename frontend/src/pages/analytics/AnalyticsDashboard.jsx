import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuClipboardList, LuUsers, LuPackage, LuTrendingUp, LuChartNoAxesColumn, LuArrowRight } from 'react-icons/lu';
import api from '../../api/axios.js';
import PageLoader from '../../components/common/PageLoader.jsx';
import toast from 'react-hot-toast';

const ModuleCard = ({ to, icon: Icon, title, description, color }) => (
  <Link
    to={to}
    className="card p-6 flex items-start gap-4 hover:shadow-md transition-shadow group"
  >
    <div className={`p-3 rounded-xl ${color} shrink-0`}>
      <Icon size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-ink-900 group-hover:text-brand-600 transition-colors">{title}</h3>
      <p className="text-sm text-ink-500 mt-1">{description}</p>
    </div>
    <LuArrowRight size={18} className="text-ink-300 group-hover:text-brand-500 transition-colors mt-1" />
  </Link>
);

const StatMini = ({ label, value, color }) => (
  <div className={`rounded-lg p-3 ${color}`}>
    <p className="text-xs font-medium opacity-75">{label}</p>
    <p className="text-xl font-bold">{value ?? 0}</p>
  </div>
);

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/overview')
      .then(res => setOverview(res.data?.overview))
      .catch(() => toast.error('Failed to load analytics overview'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <LuChartNoAxesColumn size={26} className="text-brand-600" /> Analytics & Reports
        </h1>
        <p className="text-ink-500 mt-1">System-wide statistics and performance reports.</p>
      </div>

      {/* Quick stats */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatMini label="Total Users" value={overview.users?.total} color="bg-brand-50 text-brand-700" />
          <StatMini label="Total Incidents" value={overview.incidents?.total} color="bg-warning-50 text-warning-700" />
          <StatMini label="Open Requests" value={overview.requests?.open} color="bg-danger-50 text-danger-700" />
          <StatMini label="Resources" value={overview.resources?.total} color="bg-success-50 text-success-700" />
        </div>
      )}

      {/* Module links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ModuleCard
          to="/analytics/incidents"
          icon={LuClipboardList}
          title="Incident Report"
          description="Incidents by status, category, severity and monthly trend."
          color="bg-warning-50 text-warning-600"
        />
        <ModuleCard
          to="/analytics/volunteers"
          icon={LuUsers}
          title="Volunteer Performance"
          description="Task completion rates and top performing volunteers."
          color="bg-brand-50 text-brand-600"
        />
        <ModuleCard
          to="/analytics/resources"
          icon={LuPackage}
          title="Resource Utilization"
          description="Resource availability, low stock alerts and category breakdown."
          color="bg-success-50 text-success-600"
        />
      </div>

      {/* Overview mini-grids */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-ink-800 flex items-center gap-2"><LuClipboardList size={16} /> Incidents</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(overview.incidents || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between bg-surface-50 rounded px-3 py-1.5">
                  <span className="capitalize text-ink-500">{k.replace(/([A-Z])/g,' $1').trim()}</span>
                  <span className="font-semibold text-ink-900">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-ink-800 flex items-center gap-2"><LuTrendingUp size={16} /> Users</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(overview.users || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between bg-surface-50 rounded px-3 py-1.5">
                  <span className="capitalize text-ink-500">{k.replace(/([A-Z])/g,' $1').trim()}</span>
                  <span className="font-semibold text-ink-900">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

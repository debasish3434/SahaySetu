import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LuList, LuTriangleAlert, LuClock, LuArrowRight, LuCircleCheck, LuHistory, LuInfo } from 'react-icons/lu';
import { useAuth } from '../../hooks/useAuth.js';
import { getMyTasksApi } from '../../api/incidentApi.js';
import { SeverityBadge } from '../../components/common/StatusBadge.jsx';
import PageLoader from '../../components/common/PageLoader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters.js';
import { CATEGORY_LABELS } from '../../utils/constants.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import MetricCard from '../../components/common/MetricCard.jsx';

const TASK_STATUS_STYLES = {
  assigned: 'bg-warning-100 text-warning-700',
  accepted: 'bg-brand-100 text-brand-700',
  'in-progress': 'bg-accent-100 text-accent-700',
  completed: 'bg-success-100 text-success-700',
};

const VolunteerDashboard = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getMyTasksApi();
        setTasks(data.incidents || []);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // The router selects dashboards by role; retain a defensive guard after hooks.
  if (user?.role && user.role !== 'volunteer') {
    return <div className="card p-8 text-center">Your account does not have the volunteer role.</div>;
  }

  if (loading) return <PageLoader />;

  const verificationStatus = user?.volunteerProfile?.verificationStatus;
  const assignedTasks   = tasks.filter(t => t.taskStatus === 'assigned').length;
  const activeTasks     = tasks.filter(t => t.taskStatus === 'accepted' || t.taskStatus === 'in-progress').length;
  const completedTasks  = tasks.filter(t => t.taskStatus === 'completed').length;
  const recentTasks     = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Verification banners */}
      {verificationStatus === 'pending' && (
        <div className="flex items-start gap-3 bg-warning-50 border border-warning-200 rounded-xl p-4">
          <LuInfo size={18} className="text-warning-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-warning-800">Verification Pending</p>
            <p className="text-xs text-warning-700 mt-0.5">Your volunteer profile is under review. You will be notified once approved by a coordinator.</p>
          </div>
        </div>
      )}
      {verificationStatus === 'rejected' && (
        <div className="flex items-start gap-3 bg-danger-50 border border-danger-200 rounded-xl p-4">
          <LuTriangleAlert size={18} className="text-danger-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-danger-800">Verification Rejected</p>
            <p className="text-xs text-danger-700 mt-0.5">Your volunteer application was not approved. Please contact a coordinator for more information.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader eyebrow={verificationStatus === 'verified' ? 'Verified volunteer' : 'Volunteer workspace'} title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}`} description="Review assignments, accept available work, and follow tasks through to completion." actions={<><Link to="/volunteer/my-tasks" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"><span>My tasks</span><LuArrowRight size={16} /></Link><Link to="/available-incidents" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-surface-50"><LuList size={14} /><span>Browse incidents</span></Link></>} />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard icon={LuList} label="Total assigned" value={tasks.length} tone="navy" />
        <MetricCard icon={LuClock} label="Pending acceptance" value={assignedTasks} tone="amber" />
        <MetricCard icon={LuTriangleAlert} label="Active tasks" value={activeTasks} tone="blue" />
        <MetricCard icon={LuCircleCheck} label="Completed" value={completedTasks} tone="green" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Link to="/volunteer/history" className="card p-4 text-center hover:bg-surface-50 transition-colors group">
          <LuHistory className="mx-auto mb-2 text-brand-500 group-hover:scale-110 transition-transform" size={24} />
          <p className="text-sm font-medium text-ink-700">Task History</p>
          <p className="text-xs text-ink-500">{tasks.length} total tasks</p>
        </Link>
        <Link to="/incidents/nearby" className="card p-4 text-center hover:bg-surface-50 transition-colors group">
          <LuTriangleAlert className="mx-auto mb-2 text-warning-500 group-hover:scale-110 transition-transform" size={24} />
          <p className="text-sm font-medium text-ink-700">Nearby Incidents</p>
          <p className="text-xs text-ink-500">View on map</p>
        </Link>
        <Link to="/shelters" className="card p-4 text-center hover:bg-surface-50 transition-colors group">
          <LuList className="mx-auto mb-2 text-success-500 group-hover:scale-110 transition-transform" size={24} />
          <p className="text-sm font-medium text-ink-700">Shelters</p>
          <p className="text-xs text-ink-500">View available</p>
        </Link>
      </div>

      {/* Recent Tasks Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-ink-900">Recent Assigned Tasks</h2>
          <Link to="/volunteer/my-tasks" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View All</Link>
        </div>
        {recentTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 text-ink-500 text-sm">
                  <th className="px-6 py-3 font-medium">Title & Category</th>
                  <th className="px-6 py-3 font-medium">Severity</th>
                  <th className="px-6 py-3 font-medium">Task Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {recentTasks.map(incident => (
                  <tr key={incident._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/incidents/${incident._id}`} className="block">
                        <div className="font-medium text-ink-900 hover:text-brand-600 truncate max-w-xs">{incident.title}</div>
                        <div className="text-sm text-ink-500">{CATEGORY_LABELS[incident.category] || incident.category}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4"><SeverityBadge severity={incident.severity} /></td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TASK_STATUS_STYLES[incident.taskStatus] || 'bg-surface-100 text-ink-600'}`}>
                        {incident.taskStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-600">{formatDate(incident.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No tasks assigned" message="You have no assigned tasks yet. Wait for a coordinator to assign you to an incident." icon={LuList} />
        )}
      </div>
    </motion.div>
  );
};

export default VolunteerDashboard;

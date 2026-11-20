import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LuClipboardList, LuClock, LuShieldCheck, LuCircleCheckBig, LuPlus,
  LuMapPin, LuCircleAlert, LuHouse
} from 'react-icons/lu';
import { useAuth } from '../../hooks/useAuth.js';
import { getIncidentStatsApi, getIncidentsApi } from '../../api/incidentApi.js';
import { getMyRequestsApi } from '../../api/requestApi.js';
import { unwrapIncidentsList, unwrapStats } from '../../utils/apiHelpers.js';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge.jsx';
import PageLoader from '../../components/common/PageLoader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters.js';
import { CATEGORY_LABELS } from '../../utils/constants.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import MetricCard from '../../components/common/MetricCard.jsx';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, listRes, reqRes] = await Promise.all([
          getIncidentStatsApi({ mine: 'true' }),
          getIncidentsApi({ mine: 'true', limit: 5 }),
          getMyRequestsApi(),
        ]);
        const statsData = unwrapStats(statsRes);
        setStats({
          total: statsData?.total || 0,
          pending: statsData?.byStatus?.reported || 0,
          verified: statsData?.byStatus?.verified || 0,
          resolved: statsData?.byStatus?.resolved || 0,
        });
        setRecentIncidents(unwrapIncidentsList(listRes).incidents);
        setMyRequests(reqRes.data?.requests || []);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !stats) return <PageLoader />;

  const activeRequests = myRequests.filter(r => r.status !== 'closed').length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <PageHeader eyebrow="Citizen workspace" title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}`} description="Track your reports, find nearby support, or request emergency help." actions={<><Link to="/incidents/report" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"><LuPlus size={16} />Report incident</Link><Link to="/emergency-request" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-danger-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger-600"><LuCircleAlert size={16} />Emergency request</Link></>} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={LuClipboardList} label="Total reports" value={stats.total} tone="navy" />
        <MetricCard icon={LuClock} label="Pending" value={stats.pending} tone="amber" />
        <MetricCard icon={LuShieldCheck} label="Verified" value={stats.verified} tone="blue" />
        <MetricCard icon={LuCircleCheckBig} label="Resolved" value={stats.resolved} tone="green" />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="/my-requests" className="card p-4 text-center hover:bg-surface-50 transition-colors group">
          <LuCircleAlert className="mx-auto mb-2 text-danger-500 group-hover:scale-110 transition-transform" size={24} />
          <p className="text-sm font-medium text-ink-700">My Requests</p>
          <p className="text-xs text-ink-500">{activeRequests} active</p>
        </Link>
        <Link to="/incidents/nearby" className="card p-4 text-center hover:bg-surface-50 transition-colors group">
          <LuMapPin className="mx-auto mb-2 text-brand-500 group-hover:scale-110 transition-transform" size={24} />
          <p className="text-sm font-medium text-ink-700">Nearby Incidents</p>
          <p className="text-xs text-ink-500">View on map</p>
        </Link>
        <Link to="/shelters/nearby" className="card p-4 text-center hover:bg-surface-50 transition-colors group">
          <LuHouse className="mx-auto mb-2 text-success-500 group-hover:scale-110 transition-transform" size={24} />
          <p className="text-sm font-medium text-ink-700">Nearby Shelters</p>
          <p className="text-xs text-ink-500">Find shelter</p>
        </Link>
        <Link to="/shelters" className="card p-4 text-center hover:bg-surface-50 transition-colors group">
          <LuShieldCheck className="mx-auto mb-2 text-accent-500 group-hover:scale-110 transition-transform" size={24} />
          <p className="text-sm font-medium text-ink-700">All Shelters</p>
          <p className="text-xs text-ink-500">View available</p>
        </Link>
      </div>

      {/* Recent Reports */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-ink-900">Recent Reports</h2>
          <Link to="/my-reports" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View All</Link>
        </div>
        {recentIncidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 text-ink-500 text-sm">
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Severity</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {recentIncidents.map((incident) => (
                  <tr key={incident._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/my-reports/${incident._id}`} className="font-medium text-ink-900 hover:text-brand-600">
                        {CATEGORY_LABELS[incident.category] || incident.category}
                      </Link>
                    </td>
                    <td className="px-6 py-4"><SeverityBadge severity={incident.severity} /></td>
                    <td className="px-6 py-4"><StatusBadge status={incident.status} /></td>
                    <td className="px-6 py-4 text-sm text-ink-600">{formatDate(incident.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No reports found" message="You haven't reported any incidents yet." icon={LuClipboardList} />
        )}
      </div>
    </motion.div>
  );
};

export default CitizenDashboard;

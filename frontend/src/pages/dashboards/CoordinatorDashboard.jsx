import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LuClipboardList, LuClock, LuShieldCheck, LuCircleCheckBig, LuOctagonAlert,
  LuArrowRight, LuCircleAlert, LuUserCheck, LuHouse, LuPackage
} from 'react-icons/lu';
import { useAuth } from '../../hooks/useAuth.js';
import { getIncidentStatsApi, getIncidentsApi } from '../../api/incidentApi.js';
import { getAllRequestsApi } from '../../api/requestApi.js';
import { getSheltersApi } from '../../api/shelterApi.js';
import { getResourceStatsApi } from '../../api/resourceApi.js';
import { getVerifiedVolunteersApi } from '../../api/volunteerApi.js';
import { unwrapIncidentsList, unwrapStats } from '../../utils/apiHelpers.js';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge.jsx';
import PageLoader from '../../components/common/PageLoader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters.js';
import { CATEGORY_LABELS } from '../../utils/constants.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import MetricCard from '../../components/common/MetricCard.jsx';

const PRIORITY_COLOR = {
  critical: 'bg-danger-100 text-danger-700',
  high: 'bg-warning-100 text-warning-700',
  medium: 'bg-accent-100 text-accent-700',
  low: 'bg-success-100 text-success-700',
};

const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const [incidentStats, setIncidentStats] = useState(null);
  const [requestStats, setRequestStats] = useState(null);
  const [shelterStats, setShelterStats] = useState(null);
  const [resourceStats, setResourceStats] = useState(null);
  const [verifiedVolunteers, setVerifiedVolunteers] = useState(0);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, listRes, reqRes, shelterRes, volRes] = await Promise.all([
          getIncidentStatsApi(),
          getIncidentsApi({ limit: 5 }),
          getAllRequestsApi({ limit: 5 }),
          getSheltersApi(),
          getVerifiedVolunteersApi(),
        ]);

        const statsData = unwrapStats(statsRes);
        setIncidentStats({
          total: statsData?.total || 0,
          reported: statsData?.byStatus?.reported || 0,
          verified: statsData?.byStatus?.verified || 0,
          resolved: statsData?.byStatus?.resolved || 0,
          critical: statsData?.critical || 0,
        });
        setRecentIncidents(unwrapIncidentsList(listRes).incidents);

        const allReqs = reqRes.data?.requests || [];
        const criticalReqs = allReqs.filter(r => r.priority === 'critical').length;
        const openReqs = allReqs.filter(r => r.status !== 'closed').length;
        setRequestStats({ total: allReqs.length, critical: criticalReqs, open: openReqs });
        setRecentRequests(allReqs.slice(0, 5));

        const shelters = shelterRes.data?.shelters || [];
        const openShelters = shelters.filter(s => s.status === 'open').length;
        setShelterStats({ total: shelters.length, open: openShelters });

        setVerifiedVolunteers(volRes.data?.count || 0);

        // Resource stats
        try {
          const resStats = await getResourceStatsApi();
          setResourceStats(resStats.data?.stats || null);
        } catch {
          setResourceStats(null);
        }
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <PageHeader eyebrow="Coordinator workspace" title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}`} description="Monitor live incidents and coordinate requests, volunteers, shelters, and resources." actions={<><Link to="/incident-management" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"><span>Manage incidents</span><LuArrowRight size={16} /></Link><Link to="/emergency-requests" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-4 py-2.5 text-sm font-semibold text-danger-700 transition-colors hover:bg-danger-100"><span>Emergency requests</span><LuArrowRight size={16} /></Link></>} />

      {/* Incident Stats */}
      <div>
        <h2 className="section-label">Incident overview</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricCard icon={LuClipboardList} label="Total incidents" value={incidentStats?.total ?? 0} tone="navy" />
          <MetricCard icon={LuClock} label="Reported" value={incidentStats?.reported ?? 0} tone="amber" />
          <MetricCard icon={LuShieldCheck} label="Verified" value={incidentStats?.verified ?? 0} tone="blue" />
          <MetricCard icon={LuCircleCheckBig} label="Resolved" value={incidentStats?.resolved ?? 0} tone="green" />
          <MetricCard icon={LuOctagonAlert} label="Critical" value={incidentStats?.critical ?? 0} tone="red" />
        </div>
      </div>

      {/* Emergency Requests + Volunteers + Shelters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Link to="/emergency-requests" className="card p-4 flex items-center gap-3 border-l-4 border-danger-400 hover:bg-surface-50 transition-colors">
          <div className="p-2 bg-danger-50 text-danger-600 rounded-full"><LuCircleAlert size={18} /></div>
          <div><p className="text-xs text-ink-500">Open Requests</p><p className="text-xl font-bold text-ink-900">{requestStats?.open ?? 0}</p></div>
        </Link>
        <Link to="/emergency-requests" className="card p-4 flex items-center gap-3 border-l-4 border-danger-600 hover:bg-surface-50 transition-colors">
          <div className="p-2 bg-danger-100 text-danger-700 rounded-full"><LuOctagonAlert size={18} /></div>
          <div><p className="text-xs text-ink-500">Critical Requests</p><p className="text-xl font-bold text-ink-900">{requestStats?.critical ?? 0}</p></div>
        </Link>
        <Link to="/volunteer/verify" className="card p-4 flex items-center gap-3 border-l-4 border-success-500 hover:bg-surface-50 transition-colors">
          <div className="p-2 bg-success-50 text-success-600 rounded-full"><LuUserCheck size={18} /></div>
          <div><p className="text-xs text-ink-500">Verified Volunteers</p><p className="text-xl font-bold text-ink-900">{verifiedVolunteers}</p></div>
        </Link>
        <Link to="/shelters" className="card p-4 flex items-center gap-3 border-l-4 border-brand-500 hover:bg-surface-50 transition-colors">
          <div className="p-2 bg-brand-50 text-brand-600 rounded-full"><LuHouse size={18} /></div>
          <div><p className="text-xs text-ink-500">Open Shelters</p><p className="text-xl font-bold text-ink-900">{shelterStats?.open ?? 0}</p></div>
        </Link>
        <Link to="/resources" className="card p-4 flex items-center gap-3 border-l-4 border-accent-500 transition-colors hover:bg-surface-50">
          <div className="rounded-full bg-accent-50 p-2 text-accent-700"><LuPackage size={18} /></div>
          <div><p className="text-xs text-ink-500">Low stock resources</p><p className="text-xl font-bold text-ink-900">{resourceStats?.low ?? 0}</p></div>
        </Link>
      </div>

      {/* Recent Requests Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-ink-900">Recent Emergency Requests</h2>
          <Link to="/emergency-requests" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View All</Link>
        </div>
        {recentRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 text-ink-500 text-sm">
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {recentRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-ink-900 capitalize">{req.requestType?.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLOR[req.priority] || 'bg-surface-100 text-ink-600'}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">{formatDate(req.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No emergency requests" message="No requests have been submitted yet." icon={LuCircleAlert} />
        )}
      </div>

      {/* Recent Incidents Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-ink-900">Recent Incidents</h2>
          <Link to="/incident-management" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View All</Link>
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
                      <Link to={`/incident-management/${incident._id}`} className="font-medium text-ink-900 hover:text-brand-600">
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
          <EmptyState title="No incidents" message="There are no incidents reported yet." icon={LuClipboardList} />
        )}
      </div>
    </motion.div>
  );
};

export default CoordinatorDashboard;

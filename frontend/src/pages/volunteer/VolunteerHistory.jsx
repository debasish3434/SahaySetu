import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuHistory, LuClipboardCheck, LuMapPin, LuClock } from 'react-icons/lu';
import { getVolunteerHistoryApi } from '../../api/volunteerApi.js';
import PageLoader from '../../components/common/PageLoader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge.jsx';
import { formatDate } from '../../utils/formatters.js';
import { CATEGORY_LABELS } from '../../utils/constants.js';

const TASK_STATUS_STYLES = {
  assigned: 'bg-warning-100 text-warning-700',
  accepted: 'bg-brand-100 text-brand-700',
  'in-progress': 'bg-accent-100 text-accent-700',
  completed: 'bg-success-100 text-success-700',
};

const VolunteerHistory = () => {
  const [incidents, setIncidents] = useState([]);
  const [historyStats, setHistoryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await getVolunteerHistoryApi();
        setIncidents(data.incidents || []);
        setHistoryStats(data.stats || null);
      } catch (err) {
        toast.error('Failed to load volunteer history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <PageLoader label="Loading task history..." />;

  const filtered = filter ? incidents.filter(i => i.taskStatus === filter) : incidents;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">My Task History</h1>
          <p className="text-ink-500 text-sm">SS-37 — All your previous and current task assignments</p>
        </div>
        <Link to="/volunteer/my-tasks"
          className="inline-flex items-center gap-2 px-4 py-2 border border-brand-500 text-brand-600 rounded-md hover:bg-brand-50 transition-colors text-sm font-medium">
          <LuClipboardCheck size={14} /> Active Tasks
        </Link>
      </div>

      {/* Stats */}
      {historyStats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: historyStats.total, color: 'border-ink-400', bg: 'bg-surface-100', text: 'text-ink-600' },
            { label: 'Completed', value: historyStats.completed, color: 'border-success-500', bg: 'bg-success-50', text: 'text-success-600' },
            { label: 'In Progress', value: historyStats.inProgress, color: 'border-accent-500', bg: 'bg-accent-50', text: 'text-accent-600' },
            { label: 'Accepted', value: historyStats.accepted, color: 'border-brand-500', bg: 'bg-brand-50', text: 'text-brand-600' },
            { label: 'Assigned', value: historyStats.assigned, color: 'border-warning-500', bg: 'bg-warning-50', text: 'text-warning-600' },
          ].map(s => (
            <div key={s.label} className={`card p-4 flex items-center gap-3 border-l-4 ${s.color}`}>
              <div className={`p-2 ${s.bg} ${s.text} rounded-full`}><LuHistory size={16} /></div>
              <div>
                <p className="text-xs text-ink-500">{s.label}</p>
                <p className="text-xl font-bold text-ink-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-ink-600">Filter:</label>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 focus:border-brand-500 focus:outline-none">
          <option value="">All Tasks ({incidents.length})</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="accepted">Accepted</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={LuHistory} title="No Task History" description={filter ? `No ${filter} tasks found.` : "You haven't been assigned any tasks yet."} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 text-ink-500 text-xs uppercase border-b border-surface-200">
                  <th className="px-4 py-3 font-medium">Incident</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Task Status</th>
                  <th className="px-4 py-3 font-medium">Incident Status</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {filtered.map(incident => (
                  <tr key={incident._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/incidents/${incident._id}`}
                        className="font-medium text-ink-900 hover:text-brand-600 text-sm max-w-[180px] block truncate">
                        {incident.title}
                      </Link>
                      {incident.reportedBy?.name && (
                        <p className="text-xs text-ink-400 mt-0.5">by {incident.reportedBy.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">
                      {CATEGORY_LABELS[incident.category] || incident.category}
                    </td>
                    <td className="px-4 py-3"><SeverityBadge severity={incident.severity} /></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TASK_STATUS_STYLES[incident.taskStatus] || 'bg-surface-100 text-ink-600'}`}>
                        {incident.taskStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={incident.status} /></td>
                    <td className="px-4 py-3 text-xs text-ink-500 max-w-[150px] truncate">
                      <span className="flex items-center gap-1">
                        <LuMapPin size={10} />
                        {incident.location?.address || `${incident.location?.coordinates?.[1]?.toFixed(3)}, ${incident.location?.coordinates?.[0]?.toFixed(3)}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-ink-500">
                        <LuClock size={10} /> {formatDate(incident.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VolunteerHistory;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuClipboardList, LuCheck, LuLoader, LuCircleCheck, LuMapPin } from 'react-icons/lu';
import { getMyTasksApi, acceptTaskApi, updateTaskStatusApi } from '../api/incidentApi.js';
import PageLoader from '../components/common/PageLoader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { StatusBadge, SeverityBadge } from '../components/common/StatusBadge.jsx';
import { formatDate } from '../utils/formatters.js';
import { CATEGORY_LABELS } from '../utils/constants.js';

const TASK_STATUS_STYLES = {
  assigned: 'bg-warning-100 text-warning-700',
  accepted: 'bg-brand-100 text-brand-700',
  'in-progress': 'bg-accent-100 text-accent-700',
  completed: 'bg-success-100 text-success-700',
};

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await getMyTasksApi();
      setTasks(data.incidents || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load assigned tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleAccept = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'accepting' }));
    try {
      const { data } = await acceptTaskApi(id);
      toast.success('Task accepted successfully!');
      setTasks(prev => prev.map(t => t._id === id ? data.incident : t));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept task');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoading(prev => ({ ...prev, [id]: 'updating' }));
    try {
      const { data } = await updateTaskStatusApi(id, newStatus);
      toast.success(`Task status updated to ${newStatus}`);
      setTasks(prev => prev.map(t => t._id === id ? data.incident : t));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const filteredTasks = filter ? tasks.filter(t => t.taskStatus === filter) : tasks;

  if (loading) return <PageLoader label="Loading your assigned tasks…" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">My Emergency Tasks</h1>
          <p className="mt-1 text-sm text-ink-500">
            Disaster response assignments assigned to you by coordinators.
          </p>
        </div>
        <Link to="/volunteer/history" className="inline-flex items-center gap-2 px-4 py-2 border border-brand-600 text-brand-600 rounded-md hover:bg-brand-50 transition-colors text-sm">
          View History
        </Link>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-ink-600">Filter by status:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 shadow-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Tasks</option>
          <option value="assigned">Assigned</option>
          <option value="accepted">Accepted</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <span className="text-xs text-ink-500">({filteredTasks.length} tasks)</span>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={LuClipboardList}
          title="No Tasks Found"
          description={filter ? `No tasks with status "${filter}".` : "You currently have no active response tasks assigned. Check back once verified or when coordinators assign new incidents."}
        />
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task._id} className="card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TASK_STATUS_STYLES[task.taskStatus] || 'bg-surface-100 text-ink-600'}`}>
                      Task: {task.taskStatus}
                    </span>
                    <SeverityBadge severity={task.severity} />
                    <StatusBadge status={task.status} />
                  </div>
                  <h3 className="font-semibold text-ink-900 text-lg">{task.title}</h3>
                  <p className="text-sm text-ink-600 mt-1">{task.description?.substring(0, 120)}...</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-500">
                <span className="flex items-center gap-1">
                  <LuClipboardList size={12} />
                  {CATEGORY_LABELS[task.category] || task.category}
                </span>
                {task.location?.address && (
                  <span className="flex items-center gap-1">
                    <LuMapPin size={12} />
                    {task.location.address}
                  </span>
                )}
                <span>Assigned: {formatDate(task.createdAt)}</span>
                {task.reportedBy?.name && (
                  <span>Reported by: {task.reportedBy.name}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-200">
                <Link
                  to={`/incidents/${task._id}`}
                  className="px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-md hover:bg-brand-50 transition-colors"
                >
                  View Details
                </Link>

                {task.taskStatus === 'assigned' && (
                  <button
                    onClick={() => handleAccept(task._id)}
                    disabled={actionLoading[task._id] === 'accepting'}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-success-600 rounded-md hover:bg-success-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading[task._id] === 'accepting' ? (
                      <><LuLoader size={12} className="animate-spin" /> Accepting...</>
                    ) : (
                      <><LuCheck size={12} /> Accept Task</>
                    )}
                  </button>
                )}

                {task.taskStatus === 'accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(task._id, 'in-progress')}
                    disabled={actionLoading[task._id] === 'updating'}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-accent-600 rounded-md hover:bg-accent-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading[task._id] === 'updating' ? (
                      <><LuLoader size={12} className="animate-spin" /> Updating...</>
                    ) : (
                      <><LuLoader size={12} /> Mark In Progress</>
                    )}
                  </button>
                )}

                {task.taskStatus === 'in-progress' && (
                  <button
                    onClick={() => handleUpdateStatus(task._id, 'completed')}
                    disabled={actionLoading[task._id] === 'updating'}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading[task._id] === 'updating' ? (
                      <><LuLoader size={12} className="animate-spin" /> Completing...</>
                    ) : (
                      <><LuCircleCheck size={12} /> Mark Completed</>
                    )}
                  </button>
                )}

                {task.taskStatus === 'completed' && (
                  <span className="px-3 py-1.5 text-xs font-medium text-success-700 bg-success-50 rounded-md flex items-center gap-1">
                    <LuCircleCheck size={12} /> Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MyTasks;

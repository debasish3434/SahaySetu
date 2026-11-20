import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LuBell, LuTriangleAlert, LuUserCheck, LuInfo, LuPackage, LuMegaphone, LuTrash2, LuCheckCheck,
} from 'react-icons/lu';
import api from '../api/axios.js';
import { markAsReadApi, markAllAsReadApi, deleteNotificationApi } from '../api/notificationApi.js';
import { timeAgo } from '../utils/formatters.js';
import PageLoader from '../components/common/PageLoader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TYPE_META = {
  emergency_alert:      { Icon: LuTriangleAlert, color: 'text-danger-600',  bg: 'border-l-danger-500' },
  volunteer_assignment: { Icon: LuUserCheck,     color: 'text-brand-600',   bg: 'border-l-brand-500'  },
  incident_status:      { Icon: LuInfo,          color: 'text-sky-600',     bg: 'border-l-sky-500'    },
  resource_alert:       { Icon: LuPackage,       color: 'text-warning-600', bg: 'border-l-warning-500'},
  announcement:         { Icon: LuMegaphone,     color: 'text-purple-600',  bg: 'border-l-purple-500' },
};

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'emergency_alert', label: 'Emergency Alerts' },
  { key: 'volunteer_assignment', label: 'Assignments' },
  { key: 'announcement', label: 'Announcements' },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (p = 1, f = filter) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (f === 'unread') params.isRead = false;
      else if (f) params.type = f;
      const { data } = await api.get('/notifications', { params });
      setNotifications(data.notifications || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchNotifications(page, filter); }, [fetchNotifications, page, filter]);

  const handleFilterChange = (f) => { setFilter(f); setPage(1); };

  const handleMarkRead = async (id) => {
    try { await markAsReadApi(id); fetchNotifications(page, filter); }
    catch { toast.error('Failed to mark as read'); }
  };

  const handleMarkAllRead = async () => {
    try { await markAllAsReadApi(); toast.success('All notifications marked as read'); fetchNotifications(page, filter); }
    catch { toast.error('Failed to mark all as read'); }
  };

  const handleDelete = async (id) => {
    try { await deleteNotificationApi(id); fetchNotifications(page, filter); }
    catch { toast.error('Failed to delete notification'); }
  };

  const openRelated = async (notification) => {
    if (!notification.isRead) await handleMarkRead(notification._id);
    if (!notification.relatedId) return;
    const destination = notification.relatedModel === 'EmergencyRequest'
      ? '/emergency-requests'
      : notification.relatedModel === 'Resource'
        ? '/resources'
        : `/incidents/${notification.relatedId}`;
    navigate(destination);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
            <LuBell className="text-brand-600" size={24} /> Notifications
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-danger-100 text-danger-700">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-ink-500 text-sm mt-0.5">{total} total notifications</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm transition"
          >
            <LuCheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f.key
                ? 'bg-brand-600 text-white'
                : 'bg-surface-100 text-ink-600 hover:bg-surface-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? <PageLoader /> : notifications.length === 0 ? (
        <EmptyState icon={LuBell} title="No notifications" message="Nothing here yet." />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || { Icon: LuInfo, color: 'text-ink-500', bg: 'border-l-ink-300' };
            return (
              <div
                key={n._id}
                onClick={() => openRelated(n)}
                role={n.relatedId ? 'button' : undefined}
                tabIndex={n.relatedId ? 0 : undefined}
                onKeyDown={(event) => { if (n.relatedId && (event.key === 'Enter' || event.key === ' ')) openRelated(n); }}
                className={`card flex gap-3 p-4 border-l-4 ${
                  n.isRead ? 'border-l-surface-200' : meta.bg.replace('border-l-', 'border-l-')
                } ${!n.isRead ? 'bg-brand-50/50' : ''}`}
              >
                <meta.Icon size={20} className={`mt-0.5 shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${n.isRead ? 'text-ink-700' : 'text-ink-900'}`}>
                      {n.title}
                      {!n.isRead && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-brand-600 align-middle" />}
                    </p>
                    <p className="text-xs text-ink-400 shrink-0">{timeAgo(n.createdAt)}</p>
                  </div>
                  <p className="text-sm text-ink-500 mt-0.5">{n.message}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={(event) => { event.stopPropagation(); handleMarkRead(n._id); }}
                      title="Mark as read"
                      className="p-1.5 rounded-md text-ink-400 hover:text-brand-600 hover:bg-brand-50 transition"
                    >
                      <LuCheckCheck size={16} />
                    </button>
                  )}
                  <button
                    onClick={(event) => { event.stopPropagation(); handleDelete(n._id); }}
                    title="Delete"
                    className="p-1.5 rounded-md text-ink-400 hover:text-danger-600 hover:bg-danger-50 transition"
                  >
                    <LuTrash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-ink-200 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-ink-600">Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-ink-200 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
}

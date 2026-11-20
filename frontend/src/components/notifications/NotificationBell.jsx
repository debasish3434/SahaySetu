import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LuBell,
  LuTriangleAlert,
  LuUserCheck,
  LuInfo,
  LuPackage,
  LuMegaphone,
} from 'react-icons/lu';
import { useNotifications } from '../../hooks/useNotifications.js';
import { markAsReadApi, markAllAsReadApi } from '../../api/notificationApi.js';
import { timeAgo } from '../../utils/formatters.js';

/** Map notification type to an icon and colour */
const TYPE_META = {
  emergency_alert:    { Icon: LuTriangleAlert, color: 'text-danger-600'  },
  volunteer_assignment: { Icon: LuUserCheck,   color: 'text-brand-600'   },
  incident_status:    { Icon: LuInfo,          color: 'text-sky-600'     },
  resource_alert:     { Icon: LuPackage,       color: 'text-warning-600' },
  announcement:       { Icon: LuMegaphone,     color: 'text-purple-600'  },
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, refetch } = useNotifications();

  /* Close on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsReadApi(notification._id);
        refetch();
      } catch (_) { /* silent */ }
    }
    if (notification.relatedId) {
      setOpen(false);
      const destination = notification.relatedModel === 'EmergencyRequest'
        ? '/emergency-requests'
        : notification.relatedModel === 'Resource'
          ? '/resources'
          : `/incidents/${notification.relatedId}`;
      navigate(destination);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsReadApi();
      refetch();
    } catch (_) { /* silent */ }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="relative rounded-xl p-2.5 text-ink-500 transition-colors hover:bg-surface-100 hover:text-ink-800"
        aria-label="Notifications"
      >
        <LuBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-600 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-[min(28rem,calc(100vh-6rem))] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-surface-200 bg-white shadow-card-hover">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <span className="text-sm font-semibold text-ink-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-ink-400">
              <LuBell size={32} />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <ul>
              {notifications.map((n) => {
                const meta = TYPE_META[n.type] || { Icon: LuInfo, color: 'text-ink-500' };
                return (
                  <li
                    key={n._id}
                    onClick={() => handleMarkAsRead(n)}
                    className={`flex cursor-pointer gap-3 px-4 py-3 hover:bg-ink-50 ${
                      !n.isRead ? 'bg-brand-50' : ''
                    }`}
                  >
                    <meta.Icon size={18} className={`mt-0.5 shrink-0 ${meta.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-ink-500">{n.message}</p>
                      <p className="mt-0.5 text-xs text-ink-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer */}
          <div className="border-t border-ink-100 px-4 py-2.5 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

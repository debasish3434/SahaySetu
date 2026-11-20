import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuMenu, LuChevronDown, LuLogOut, LuUserRound, LuPanelLeftClose, LuPanelLeftOpen } from 'react-icons/lu';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getInitials } from '../../utils/formatters.js';
import { ROLE_LABELS } from '../../utils/constants.js';
import NotificationBell from '../notifications/NotificationBell.jsx';

/**
 * Top app bar shown across all authenticated pages.
 * Hosts the mobile menu toggle, user avatar, and account dropdown.
 */
const Navbar = ({ onMenuClick, onCollapseClick, collapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const segments = location.pathname.split('/').filter(Boolean);
  const currentPage = segments.at(-1) || 'dashboard';
  const routeNames = {
    dashboard: 'Dashboard', users: 'User management', volunteers: 'Volunteer management',
    incidents: 'Incident management', 'incident-management': 'Incident management',
    'emergency-requests': 'Emergency requests', 'super-admin': 'Super Admin console',
    analytics: 'Analytics', notifications: 'Notifications', profile: 'My profile',
    settings: 'Account settings', resources: 'Relief resources', shelters: 'Shelters',
    announcements: 'Announcements', 'my-reports': 'My reports', 'my-requests': 'My requests',
    'my-tasks': 'My tasks', history: 'Activity history', register: 'Register shelter',
  };
  const pageLabel = routeNames[currentPage] || currentPage.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-surface-200 bg-white/95 px-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-ink-700 hover:bg-ink-100 lg:hidden"
        aria-label="Open menu"
      >
        <LuMenu size={22} />
      </button>
      <button onClick={onCollapseClick} className="hidden rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:block" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}>
        {collapsed ? <LuPanelLeftOpen size={19} /> : <LuPanelLeftClose size={19} />}
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink-900 sm:text-[15px]">{pageLabel}</p>
        <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-[11px] text-ink-400 sm:flex">
          <span>SahaySetu</span>{segments.slice(0, -1).map((segment, index) => <span key={`${segment}-${index}`} className="inline-flex items-center gap-1"><span aria-hidden="true">/</span><span className="capitalize">{routeNames[segment] || segment.replace(/-/g, ' ')}</span></span>)}
        </nav>
      </div>
      </div>

      <div className="relative flex items-center gap-4" ref={menuRef}>
        <NotificationBell />

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Open user menu"
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 hover:bg-ink-100"
        >
          {user?.profilePhoto?.url ? (
            <img
              src={user.profilePhoto.url}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
              {getInitials(user?.name)}
            </span>
          )}
          <span className="hidden text-sm font-medium text-ink-900 sm:block">{user?.name}</span>
          <LuChevronDown size={16} className="text-ink-500" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-ink-100 bg-white py-1.5 shadow-card-hover">
            <div className="border-b border-ink-100 px-4 py-2.5">
              <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
              <p className="text-xs text-ink-500">{user?.isSuperAdmin ? 'Super Admin · Owner' : ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-100"
            >
              <LuUserRound size={16} /> My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-100"
            >
              <LuLogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

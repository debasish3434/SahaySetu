import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LuLayoutDashboard,
  LuTriangleAlert,
  LuClipboardList,
  LuUserRound,
  LuShieldCheck,
  LuEye,
  LuX,
  LuMapPin,
  LuSettings,
  LuHeartHandshake,
  LuUserCheck,
  LuClipboardCheck,
  LuCircleAlert,
  LuHouse,
  LuPackage,
  LuHistory,
  LuCirclePlus,
  LuBell,
  LuChartNoAxesColumn,
  LuSettings2,
  LuMegaphone,
  LuCrown,
  LuLogOut,
} from 'react-icons/lu';
import { useAuth } from '../../hooks/useAuth.js';

const NAV_BY_ROLE = {
  citizen: [
    { to: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { to: '/incidents/report', label: 'Report Incident', icon: LuTriangleAlert },
    { to: '/emergency-request', label: 'Emergency Request', icon: LuCircleAlert },
    { to: '/incidents/nearby', label: 'Nearby Incidents', icon: LuMapPin },
    { to: '/my-reports', label: 'My Reports', icon: LuClipboardList },
    { to: '/my-requests', label: 'My Requests', icon: LuClipboardCheck },
    { to: '/shelters', label: 'View Shelters', icon: LuHouse },
    { to: '/shelters/nearby', label: 'Nearby Shelters', icon: LuMapPin },
    { to: '/volunteer/apply', label: 'Become a Volunteer', icon: LuHeartHandshake },
    { to: '/notifications', label: 'Notifications', icon: LuBell },
    { to: '/profile', label: 'My Profile', icon: LuUserRound },
    { to: '/settings', label: 'Account Settings', icon: LuSettings },
  ],
  volunteer: [
    { to: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { to: '/available-incidents', label: 'Available Incidents', icon: LuEye },
    { to: '/incidents/nearby', label: 'Nearby Incidents', icon: LuMapPin },
    { to: '/volunteer/my-tasks', label: 'My Tasks', icon: LuClipboardCheck },
    { to: '/volunteer/history', label: 'Task History', icon: LuHistory },
    { to: '/shelters', label: 'View Shelters', icon: LuHouse },
    { to: '/shelters/nearby', label: 'Nearby Shelters', icon: LuMapPin },
    { to: '/volunteer/apply', label: 'Volunteer Status', icon: LuHeartHandshake },
    { to: '/notifications', label: 'Notifications', icon: LuBell },
    { to: '/profile', label: 'My Profile', icon: LuUserRound },
    { to: '/settings', label: 'Account Settings', icon: LuSettings },
  ],
  coordinator: [
    { to: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { to: '/incident-management', label: 'Manage Incidents', icon: LuShieldCheck },
    { to: '/emergency-requests', label: 'Emergency Requests', icon: LuCircleAlert },
    { to: '/incidents/nearby', label: 'Nearby Incidents', icon: LuMapPin },
    { to: '/volunteer/verify', label: 'Verify Volunteers', icon: LuUserCheck },
    { to: '/shelters', label: 'Manage Shelters', icon: LuHouse },
    { to: '/shelters/register', label: 'Register Shelter', icon: LuCirclePlus },
    { to: '/shelters/nearby', label: 'Nearby Shelters', icon: LuMapPin },
    { to: '/resources', label: 'Relief Resources', icon: LuPackage },
    { to: '/analytics', label: 'Analytics', icon: LuChartNoAxesColumn },
    { to: '/notifications', label: 'Notifications', icon: LuBell },
    { to: '/profile', label: 'My Profile', icon: LuUserRound },
    { to: '/settings', label: 'Account Settings', icon: LuSettings },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { to: '/admin/volunteers', label: 'Manage Volunteers', icon: LuUserCheck },
    { to: '/admin/incidents', label: 'Incident Management', icon: LuClipboardList },
    { to: '/emergency-requests', label: 'Emergency Requests', icon: LuCircleAlert },
    { to: '/incidents/nearby', label: 'Nearby Incidents', icon: LuMapPin },
    { to: '/volunteer/verify', label: 'Verify Volunteers', icon: LuUserCheck },
    { to: '/shelters', label: 'Shelters', icon: LuHouse },
    { to: '/shelters/register', label: 'Register Shelter', icon: LuCirclePlus },
    { to: '/resources', label: 'Relief Resources', icon: LuPackage },
    { to: '/analytics', label: 'Analytics', icon: LuChartNoAxesColumn },
    { to: '/notifications', label: 'Notifications', icon: LuBell },
    { to: '/admin/announcements', label: 'Send Announcement', icon: LuMegaphone },
    { to: '/admin/settings', label: 'System Settings', icon: LuSettings2 },
    { to: '/profile', label: 'My Profile', icon: LuUserRound },
    { to: '/settings', label: 'Account Settings', icon: LuSettings },
  ],
};

const Sidebar = ({ open, onClose, collapsed = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.citizen;
  const permissionForPath = (path) => {
    if (path.startsWith('/admin/volunteers') || path.startsWith('/volunteer/verify')) return 'volunteer_management';
    if (path.startsWith('/admin/incidents') || path.startsWith('/incident-management') || path.startsWith('/incidents/nearby')) return 'incident_management';
    if (path.startsWith('/emergency-requests')) return 'request_management';
    if (path.startsWith('/shelters/register') || path.startsWith('/shelters/manage') || path === '/shelters') return 'shelter_management';
    if (path.startsWith('/resources')) return 'resource_management';
    if (path.startsWith('/analytics')) return 'analytics';
    if (path.startsWith('/admin/settings')) return 'system_settings';
    if (path.startsWith('/admin/announcements')) return 'announcements';
    return null;
  };
  const visibleNavItems = navItems.filter(({ to }) => {
    const permission = permissionForPath(to);
    return user?.role !== 'admin' || user?.isSuperAdmin || !permission || user?.adminPermissions?.includes(permission);
  });
  if (user?.isSuperAdmin) visibleNavItems.push({ to: '/admin/super-admin', label: 'Super Admin Console', icon: LuCrown, ownerOnly: true });

  const signOut = () => { logout(); navigate('/login'); onClose?.(); };

  return (
    <>
      {/* Mobile scrim */}
      {open && (
        <div className="fixed inset-0 z-30 bg-brand-950/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex ${collapsed ? 'lg:w-[5.25rem]' : 'w-64 lg:w-64'} w-64 flex-col bg-brand-900 text-white transition-all duration-300 ease-in-out lg:static lg:z-0 lg:!translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`flex items-center justify-between py-6 ${collapsed ? 'px-4 lg:justify-center' : 'px-6'}`}>
          <div className={collapsed ? 'lg:hidden' : ''}>
            <p className="font-display text-lg font-bold tracking-tight">SahaySetu</p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-brand-200/75">Response Network</p>
          </div>
          {collapsed && <span className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white/10 font-display font-bold text-white lg:flex" aria-label="SahaySetu">S</span>}
          <button onClick={onClose} className="text-brand-100/70 hover:text-white lg:hidden" aria-label="Close menu">
            <LuX size={20} />
          </button>
        </div>

        <div className="mx-5 mb-4 h-px bg-white/10" />

        <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-3">
          {visibleNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors ${collapsed ? 'lg:justify-center lg:px-2' : ''} ${
                  isActive
                    ? 'bg-white/10 text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent-400'
                    : 'text-brand-100/80 hover:bg-white/[0.06] hover:text-white'
                }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 border-t border-white/10 p-3">
          <Link to="/profile" onClick={onClose} title={collapsed ? user?.name : undefined} className={`flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-white/[0.06] ${collapsed ? 'lg:justify-center' : ''}`}>
            {user?.profilePhoto?.url ? <img src={user.profilePhoto.url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/10" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">{user?.name?.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</span>}
            <span className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}><span className="block truncate text-sm font-semibold text-white">{user?.name}</span><span className="mt-0.5 block truncate text-[11px] capitalize text-brand-200/70">{user?.isSuperAdmin ? 'Super Admin · Owner' : user?.role}</span></span>
          </Link>
          <button onClick={signOut} title={collapsed ? 'Sign out' : undefined} className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-brand-100/75 transition-colors hover:bg-white/[0.06] hover:text-white ${collapsed ? 'lg:justify-center' : ''}`}><LuLogOut size={17} /><span className={collapsed ? 'lg:hidden' : ''}>Sign out</span></button>
          <p className={`px-3 pt-3 text-[10px] text-brand-200/45 ${collapsed ? 'lg:hidden' : ''}`}>&copy; 2026 SahaySetu</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

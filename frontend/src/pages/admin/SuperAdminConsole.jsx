import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { useAuth } from '../../hooks/useAuth.js';
import PageHeader from '../../components/common/PageHeader.jsx';

const TABS = ['Overview', 'Approvals', 'Administrator Management', 'Activity Logs'];
const PERMISSIONS = [
  ['volunteer_management', 'Volunteer management'],
  ['incident_management', 'Incident management'], ['request_management', 'Emergency requests'],
  ['shelter_management', 'Shelters'], ['resource_management', 'Resources'],
  ['analytics', 'Analytics'], ['system_settings', 'System settings'], ['announcements', 'Announcements'],
];
const card = 'rounded-2xl border border-ink-100 bg-white p-5 shadow-sm';
const blankInvite = { name: '', email: '', initialPassword: '', confirmPassword: '', permissions: [], accountStatus: 'active' };

export default function SuperAdminConsole() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [overview, setOverview] = useState(null);
  const [applications, setApplications] = useState([]);
  const [administrators, setAdministrators] = useState([]);
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [roleFilter, setRoleFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [permissionDrafts, setPermissionDrafts] = useState({});
  const [credentialDrafts, setCredentialDrafts] = useState({});
  const [invite, setInvite] = useState(blankInvite);
  const [inviteResult, setInviteResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [summary, apps, admins, logs] = await Promise.all([
        api.get('/super-admin/overview'),
        api.get('/super-admin/applications', { params: { status: filter, role: roleFilter === 'all' ? undefined : roleFilter, search: query || undefined } }),
        api.get('/super-admin/administrators', { params: { search: query || undefined } }),
        api.get('/super-admin/activity'),
      ]);
      setOverview(summary.data.overview);
      setApplications(apps.data.applications);
      setAdministrators(admins.data.administrators);
      setActivities(logs.data.activities);
      setPermissionDrafts(Object.fromEntries(admins.data.administrators.map(admin => [admin._id, (admin.adminPermissions || []).filter(permission => permission !== 'user_management')])));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load Super Admin data');
    }
  }, [filter, roleFilter, query]);

  useEffect(() => { load(); }, [load]);

  if (!user?.isSuperAdmin) return <div className={card}><h1 className="text-xl font-bold">Super Admin access required</h1><p className="mt-2 text-ink-600">This area is restricted to the platform owner.</p><Link className="mt-4 inline-block text-accent-700" to="/dashboard">Return to dashboard</Link></div>;

  const decide = async (id, decision) => {
    setBusy(true);
    try { await api.patch(`/super-admin/applications/${id}`, { decision }); toast.success(`Application ${decision}`); await load(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not review application'); }
    finally { setBusy(false); }
  };

  const createAdministrator = async (event) => {
    event.preventDefault(); setBusy(true); setInviteResult(null);
    try {
      const { data } = await api.post('/super-admin/administrators/invitations', invite);
      setInviteResult({ administratorId: data.administratorId, email: data.email, initialPassword: invite.initialPassword });
      toast.success('Administrator account created. Password change is required at first sign-in.');
      setInvite(blankInvite);
      await load();
    } catch (error) { toast.error(error.response?.data?.message || 'Could not create administrator invitation'); }
    finally { setBusy(false); }
  };

  const setActive = async (admin, isActive) => {
    try { await api.patch(`/super-admin/administrators/${admin._id}/status`, { isActive }); toast.success(`Administrator ${isActive ? 'activated' : 'deactivated'}`); await load(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not update administrator'); }
  };

  const revoke = async (admin) => {
    if (!window.confirm(`Revoke administrator access for ${admin.name}?`)) return;
    try { await api.patch(`/super-admin/administrators/${admin._id}/revoke`); toast.success('Administrator access revoked'); await load(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not revoke access'); }
  };

  const savePermissions = async (admin) => {
    try { await api.patch(`/super-admin/administrators/${admin._id}/permissions`, { permissions: permissionDrafts[admin._id] || [] }); toast.success('Administrator permissions updated'); await load(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not update permissions'); }
  };

  const resetCredentials = async (event, admin) => {
    event.preventDefault();
    const credentials = credentialDrafts[admin._id] || {};
    if (!credentials.initialPassword || credentials.initialPassword !== credentials.confirmPassword) {
      toast.error('Enter and confirm the same initial password.');
      return;
    }
    try {
      const { data } = await api.patch(`/super-admin/administrators/${admin._id}/credentials`, credentials);
      toast.success(data.message);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not reset administrator credentials');
    }
  };

  const reviewStats = Object.entries({
    'Total users': overview?.total, Citizens: overview?.citizens, Volunteers: overview?.volunteers,
    Coordinators: overview?.coordinators, Administrators: overview?.admins, 'Active accounts': overview?.activeUsers,
    'Inactive accounts': overview?.inactiveUsers, 'Pending volunteer approvals': overview?.pendingVolunteers,
    'Pending coordinator approvals': overview?.pendingCoordinators,
  });

  return <div className="mx-auto max-w-7xl space-y-6">
    <PageHeader eyebrow="Owner controls" title="Super Admin workspace" description="Manage approvals, administrator permissions, and platform security." actions={<button onClick={load} className="rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-surface-50">Refresh</button>} />
    <nav className="flex gap-2 overflow-x-auto border-b">{TABS.map(item => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap border-b-2 px-4 py-3 font-semibold ${tab === item ? 'border-accent-600 text-accent-700' : 'border-transparent text-ink-500'}`}>{item}</button>)}</nav>

    {tab === 'Overview' && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{reviewStats.map(([label, value]) => <div className={card} key={label}><p className="text-sm text-ink-500">{label}</p><p className="mt-2 text-3xl font-bold">{value ?? '—'}</p></div>)}</div><button onClick={() => setTab('Administrator Management')} className="rounded-2xl bg-accent-700 px-5 py-4 font-bold text-white shadow-sm hover:bg-accent-800">+ Add New Administrator</button><div className={card}><h2 className="text-lg font-bold">Recent administrative activity</h2><ActivityList items={activities.slice(0, 8)} /></div></>}

    {tab === 'Approvals' && <div className={card}><div className="mb-4 flex flex-wrap gap-3"><select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border px-3 py-2"><option value="pending">Pending approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="rounded-xl border px-3 py-2"><option value="all">Volunteers and coordinators</option><option value="volunteer">Volunteers</option><option value="coordinator">Coordinators</option></select><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or email" className="min-w-56 flex-1 rounded-xl border px-3 py-2" /></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead><tr className="border-b text-ink-500"><th className="p-3">Applicant</th><th className="p-3">Role</th><th className="p-3">Registered</th><th className="p-3">Approval</th><th className="p-3">Actions</th></tr></thead><tbody>{applications.map(app => <tr key={app._id} className="border-b last:border-0"><td className="p-3"><strong>{app.name}</strong><div className="text-ink-500">{app.email}</div>{detailId === app._id && <div className="mt-2 text-xs text-ink-600">Phone: {app.phone || 'Not provided'}{app.rejectionReason ? ` · Reason: ${app.rejectionReason}` : ''}</div>}</td><td className="p-3 capitalize">{app.role}</td><td className="p-3">{new Date(app.createdAt).toLocaleDateString()}</td><td className="p-3 capitalize">{app.approvalStatus}</td><td className="p-3"><div className="flex flex-wrap gap-2"><button onClick={() => setDetailId(detailId === app._id ? null : app._id)} className="rounded-lg border px-3 py-1.5 font-semibold">{detailId === app._id ? 'Hide details' : 'Details'}</button>{app.approvalStatus === 'pending' && <><button disabled={busy} onClick={() => decide(app._id, 'approved')} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">Approve</button><button disabled={busy} onClick={() => decide(app._id, 'rejected')} className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">Reject</button></>}</div></td></tr>)}</tbody></table>{!applications.length && <p className="p-6 text-center text-ink-500">No applications found.</p>}</div></div>}

    {tab === 'Administrator Management' && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]"><section className={card}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Administrator accounts</h2><p className="text-sm text-ink-500">Secondary admins only receive the modules selected by you.</p></div><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search admins" className="rounded-xl border px-3 py-2" /></div><div className="space-y-3">{administrators.map(admin => <article key={admin._id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{admin.name} {admin.isSuperAdmin && <span className="ml-2 rounded-full bg-violet-100 px-2 py-1 text-xs text-violet-800">Super Admin · Owner</span>}</p><p className="text-sm text-ink-500">{admin.email}</p><p className="text-xs text-ink-500">{admin.administratorId || 'No Administrator ID'} · {admin.isActive ? 'Active' : 'Inactive'} · {admin.isSuperAdmin ? 'Owner account' : 'Secondary administrator'}</p><p className="mt-1 text-xs text-ink-500">{admin.isSuperAdmin ? 'All owner controls' : `${(admin.adminPermissions || []).length} module permissions`} · Account setup: {admin.mustChangePassword ? 'Password change required at first login' : 'Complete'}</p></div><div className="flex flex-wrap gap-2">{!admin.isSuperAdmin && <><button onClick={() => setActive(admin, !admin.isActive)} className="rounded-lg border px-3 py-2 text-sm font-semibold">{admin.isActive ? 'Deactivate' : 'Activate'}</button><button onClick={() => revoke(admin)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700">Revoke access</button></>}<button onClick={() => setDetailId(detailId === admin._id ? null : admin._id)} className="rounded-lg border px-3 py-2 text-sm font-semibold">{detailId === admin._id ? 'Hide' : 'Details'}</button></div></div>{detailId === admin._id && <div className="mt-4 border-t pt-4"><p className="text-xs text-ink-500">Created {new Date(admin.createdAt).toLocaleString()}{admin.invitedBy ? ` by ${admin.invitedBy.name}` : ''}</p>{!admin.isSuperAdmin && <><div className="mt-3 grid gap-2 sm:grid-cols-2">{PERMISSIONS.map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(permissionDrafts[admin._id] || []).includes(key)} onChange={e => setPermissionDrafts(current => ({ ...current, [admin._id]: e.target.checked ? [...(current[admin._id] || []), key] : (current[admin._id] || []).filter(value => value !== key) }))} />{label}</label>)}</div><button onClick={() => savePermissions(admin)} className="mt-3 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white">Save permissions</button><form onSubmit={event => resetCredentials(event, admin)} className="mt-5 space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4"><div><h3 className="font-semibold">Reset first-login credentials</h3><p className="text-xs text-ink-600">Keeps this Administrator ID, sets a new initial password, and requires a password change after sign-in.</p></div><input required minLength="8" type="password" autoComplete="new-password" placeholder="New initial password (8+ characters and a number)" value={credentialDrafts[admin._id]?.initialPassword || ''} onChange={event => setCredentialDrafts(current => ({ ...current, [admin._id]: { ...current[admin._id], initialPassword: event.target.value } }))} className="w-full rounded-lg border px-3 py-2 text-sm" /><input required minLength="8" type="password" autoComplete="new-password" placeholder="Confirm new initial password" value={credentialDrafts[admin._id]?.confirmPassword || ''} onChange={event => setCredentialDrafts(current => ({ ...current, [admin._id]: { ...current[admin._id], confirmPassword: event.target.value } }))} className="w-full rounded-lg border px-3 py-2 text-sm" /><div className="flex flex-wrap gap-2"><button className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900">Reset login credentials</button><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(credentialDrafts[admin._id]?.initialPassword || ''); toast.success('Initial password copied'); } catch { toast.error('Could not copy the password'); } }} className="rounded-lg border px-3 py-2 text-sm font-semibold">Copy initial password</button></div></form></>}</div>}</article>)}{!administrators.length && <p className="py-5 text-ink-500">No administrator accounts found.</p>}</div></section>

      <div className="space-y-4"><form onSubmit={createAdministrator} className={`${card} space-y-4`}><div><h2 className="text-lg font-bold">+ Add New Administrator</h2><p className="mt-1 text-sm text-ink-600">Create the account and choose its initial password. Give the new administrator their generated ID and this password directly. They will set a new password after their first sign-in.</p></div><label className="block text-sm font-medium">Full name<input required minLength="2" maxLength="60" value={invite.name} onChange={e => setInvite({ ...invite, name: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></label><label className="block text-sm font-medium">Email address<input required type="email" value={invite.email} onChange={e => setInvite({ ...invite, email: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></label><label className="block text-sm font-medium">Initial password<input required type="password" minLength="8" value={invite.initialPassword} onChange={e => setInvite({ ...invite, initialPassword: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /><span className="mt-1 block text-xs text-ink-500">At least 8 characters and one number. It is stored as a hash; the confirmation shows it once so you can pass it to the new administrator.</span></label><label className="block text-sm font-medium">Confirm initial password<input required type="password" minLength="8" value={invite.confirmPassword} onChange={e => setInvite({ ...invite, confirmPassword: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" /></label><fieldset><legend className="text-sm font-semibold">Administrator permissions</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{PERMISSIONS.map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={invite.permissions.includes(key)} onChange={e => setInvite(current => ({ ...current, permissions: e.target.checked ? [...current.permissions, key] : current.permissions.filter(value => value !== key) }))} />{label}</label>)}</div></fieldset><label className="block text-sm font-medium">Account status<select value={invite.accountStatus} onChange={e => setInvite({ ...invite, accountStatus: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option></select></label><button disabled={busy} className="w-full rounded-xl bg-accent-600 px-4 py-3 font-bold text-white disabled:opacity-50">Create administrator account</button></form>

        {inviteResult && <div className={`${card} space-y-3`}><h3 className="font-bold">Administrator account created</h3><p className="text-sm">Administrator ID: <strong className="select-all">{inviteResult.administratorId}</strong></p><p className="text-sm text-ink-600">Account email: {inviteResult.email}</p><p className="rounded-lg bg-accent-50 p-3 text-sm text-accent-900">Give the administrator this ID and the initial password below. They can sign in with the ID and password, then must choose a new password. No invitation link is needed.</p><label className="block text-sm font-medium">Initial password for first sign-in<input readOnly type="password" value={inviteResult.initialPassword} className="mt-1 w-full rounded-xl border px-3 py-2" autoComplete="off" /></label><div className="flex flex-wrap gap-2"><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(inviteResult.administratorId); toast.success('Administrator ID copied'); } catch { toast.error('Copy failed; select and copy the ID above.'); } }} className="rounded-lg border px-3 py-2 text-sm font-semibold">Copy Administrator ID</button><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(inviteResult.initialPassword); toast.success('Initial password copied'); } catch { toast.error('Copy failed; select and copy the password field.'); } }} className="rounded-lg border px-3 py-2 text-sm font-semibold">Copy initial password</button></div><p className="text-xs text-ink-500">This credential summary is only held in this page while it remains open. The server stores the password as a hash.</p></div>}</div></div>}

    {tab === 'Activity Logs' && <div className={card}><h2 className="text-lg font-bold">Administrative activity</h2><ActivityList items={activities} /></div>}
  </div>;
}

function ActivityList({ items }) {
  return <div className="mt-3 divide-y">{items.map(item => <div key={item._id} className="flex flex-wrap justify-between gap-2 py-3"><div><p className="font-semibold capitalize">{item.action.replaceAll('_', ' ')}</p><p className="text-sm text-ink-500">By {item.actor?.name || 'Administrator'}{item.targetEmail ? ` · ${item.targetEmail}` : ''}{item.details ? ` · ${item.details}` : ''}</p></div><time className="text-sm text-ink-500">{new Date(item.createdAt).toLocaleString()}</time></div>)}{!items.length && <p className="py-5 text-ink-500">No activity has been recorded yet.</p>}</div>;
}

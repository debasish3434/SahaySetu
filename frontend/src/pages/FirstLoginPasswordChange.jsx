import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuKeyRound, LuShieldCheck } from 'react-icons/lu';
import { changePasswordApi } from '../api/authApi.js';
import { useAuth } from '../hooks/useAuth.js';

export default function FirstLoginPasswordChange() {
  const { user, adoptSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('The new passwords do not match.');
    if (form.newPassword.length < 8 || !/\d/.test(form.newPassword)) return toast.error('Use at least 8 characters and include a number.');

    setBusy(true);
    try {
      const { data } = await changePasswordApi({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      adoptSession(data.token, data.user);
      toast.success('Password updated. Your administrator account is ready.');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update your password.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-surface-50 px-4 py-10">
    <section className="w-full max-w-lg rounded-3xl border border-surface-200 bg-white p-7 shadow-xl sm:p-9">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-700"><LuShieldCheck size={24} /></div>
      <p className="mt-6 text-sm font-semibold text-accent-700">Administrator account setup</p>
      <h1 className="mt-2 text-2xl font-bold text-ink-900">Choose your password</h1>
      <p className="mt-2 text-sm leading-6 text-ink-600">Welcome{user?.name ? `, ${user.name}` : ''}. For security, replace the initial password before accessing your administrator dashboard.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-ink-800">Initial password<input required autoComplete="current-password" type="password" value={form.currentPassword} onChange={event => setForm({ ...form, currentPassword: event.target.value })} className="mt-1 w-full rounded-xl border border-surface-300 px-3 py-2.5" /></label>
        <label className="block text-sm font-medium text-ink-800">New password<input required minLength={8} autoComplete="new-password" type="password" value={form.newPassword} onChange={event => setForm({ ...form, newPassword: event.target.value })} className="mt-1 w-full rounded-xl border border-surface-300 px-3 py-2.5" /><span className="mt-1 block text-xs text-ink-500">At least 8 characters and one number.</span></label>
        <label className="block text-sm font-medium text-ink-800">Confirm new password<input required minLength={8} autoComplete="new-password" type="password" value={form.confirmPassword} onChange={event => setForm({ ...form, confirmPassword: event.target.value })} className="mt-1 w-full rounded-xl border border-surface-300 px-3 py-2.5" /></label>
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-700 px-4 py-3 font-semibold text-white hover:bg-accent-800 disabled:opacity-50"><LuKeyRound size={17} />{busy ? 'Updating password…' : 'Set password and continue'}</button>
      </form>
    </section>
  </main>;
}

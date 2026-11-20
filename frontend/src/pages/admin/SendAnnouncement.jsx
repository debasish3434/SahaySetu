import { useState } from 'react';
import { LuMegaphone, LuSend, LuUsers, LuCheck } from 'react-icons/lu';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';

const ROLE_OPTIONS = [
  { value: 'citizen',     label: 'Citizens',     color: 'bg-blue-100 text-blue-800'   },
  { value: 'volunteer',   label: 'Volunteers',   color: 'bg-green-100 text-green-800' },
  { value: 'coordinator', label: 'Coordinators', color: 'bg-purple-100 text-purple-800' },
  { value: 'admin',       label: 'Admins',       color: 'bg-red-100 text-red-800'     },
];

export default function SendAnnouncement() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({ title: '', message: '', targetRoles: [] });
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <LuMegaphone className="text-brand-300 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-ink-700">Access Restricted</h2>
        <p className="text-ink-500 mt-2">Only administrators can send announcements.</p>
      </div>
    );
  }

  const toggleRole = (role) => {
    setForm((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const selectAll = () => setForm((prev) => ({ ...prev, targetRoles: ROLE_OPTIONS.map((r) => r.value) }));
  const clearAll  = () => setForm((prev) => ({ ...prev, targetRoles: [] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.message.trim()) return toast.error('Message is required');

    setSubmitting(true);
    setLastResult(null);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/notifications/announcement`,
        {
          title: form.title.trim(),
          message: form.message.trim(),
          targetRoles: form.targetRoles.length > 0 ? form.targetRoles : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message || 'Announcement sent!');
      setLastResult({ recipientCount: data.recipientCount, title: form.title });
      setForm({ title: '', message: '', targetRoles: [] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-brand-100 p-3">
          <LuMegaphone className="text-brand-600" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink-900">Send Announcement</h1>
          <p className="text-sm text-ink-500">Broadcast a message to users by role (SS-54)</p>
        </div>
      </div>

      {/* Success banner */}
      {lastResult && (
        <div className="rounded-xl border border-success-200 bg-success-50 p-4 flex items-start gap-3">
          <LuCheck className="text-success-600 mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold text-success-800">Announcement Sent!</p>
            <p className="text-sm text-success-700 mt-0.5">
              &quot;<span className="font-medium">{lastResult.title}</span>&quot; was delivered to{' '}
              <span className="font-medium">{lastResult.recipientCount}</span> user(s).
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Announcement Title <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Important Safety Update"
            maxLength={120}
            className="w-full rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm text-ink-800 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition"
          />
          <p className="text-xs text-ink-400 mt-1">{form.title.length}/120 characters</p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Message <span className="text-danger-500">*</span>
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            placeholder="Write your announcement message here…"
            rows={5}
            maxLength={1000}
            className="w-full rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm text-ink-800 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition resize-none"
          />
          <p className="text-xs text-ink-400 mt-1">{form.message.length}/1000 characters</p>
        </div>

        {/* Target roles */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-ink-700">
              <LuUsers className="inline mr-1.5" size={15} />
              Target Audience
            </label>
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={selectAll} className="text-brand-600 hover:underline">Select All</button>
              <span className="text-ink-300">|</span>
              <button type="button" onClick={clearAll} className="text-ink-500 hover:underline">Clear</button>
            </div>
          </div>
          <p className="text-xs text-ink-500 mb-3">Leave all unchecked to send to every user.</p>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map(({ value, label, color }) => {
              const checked = form.targetRoles.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleRole(value)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                    checked
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-400'
                      : 'border-surface-300 bg-white text-ink-600 hover:border-brand-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-sm border-2 flex items-center justify-center transition ${
                    checked ? 'border-brand-600 bg-brand-600' : 'border-surface-400 bg-white'
                  }`}>
                    {checked && <LuCheck size={10} className="text-white" />}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{label}</span>
                </button>
              );
            })}
          </div>
          {form.targetRoles.length > 0 && (
            <p className="text-xs text-brand-600 mt-2 font-medium">
              Will be sent to: {form.targetRoles.map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label).join(', ')}
            </p>
          )}
          {form.targetRoles.length === 0 && (
            <p className="text-xs text-ink-500 mt-2">Will be sent to all users (all roles)</p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2 border-t border-surface-100">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <LuSend size={16} />
            {submitting ? 'Sending…' : 'Send Announcement'}
          </button>
        </div>
      </form>

      {/* Info box */}
      <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm text-ink-500">
        <p className="font-medium text-ink-700 mb-1">ℹ️ How announcements work</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Announcements appear in each user&apos;s Notification Centre.</li>
          <li>Users will see an unread badge on the bell icon.</li>
          <li>Select specific roles or leave blank to broadcast to everyone.</li>
        </ul>
      </div>
    </div>
  );
}

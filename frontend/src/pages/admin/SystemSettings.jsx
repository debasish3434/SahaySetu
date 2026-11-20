import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LuSettings, LuSave } from 'react-icons/lu';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import PageLoader from '../../components/common/PageLoader.jsx';

const SettingRow = ({ label, description, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-surface-200 last:border-0">
    <div>
      <p className="text-sm font-medium text-ink-900">{label}</p>
      {description && <p className="text-xs text-ink-500 mt-0.5">{description}</p>}
    </div>
    <div className="sm:min-w-56">{children}</div>
  </div>
);

const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${value ? 'bg-brand-600' : 'bg-ink-300'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(res => setSettings(res.data?.settings || res.data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  if (loading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <LuSettings className="text-brand-600" size={24} /> System Settings
        </h1>
        <p className="text-ink-500 text-sm mt-0.5">Configure platform-wide settings. Restricted to administrators.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card divide-y divide-surface-200 overflow-hidden">
          <div className="px-6 py-4 bg-surface-50 border-b border-surface-200">
            <h2 className="font-semibold text-ink-800">General</h2>
          </div>
          <div className="px-6">
            <SettingRow label="Platform Name" description="The name displayed across the application.">
              <input
                value={settings?.platformName || ''}
                onChange={e => set('platformName', e.target.value)}
                className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </SettingRow>
            <SettingRow label="Support Email" description="Email address shown for user support.">
              <input
                type="email"
                value={settings?.supportEmail || ''}
                onChange={e => set('supportEmail', e.target.value)}
                className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </SettingRow>
          </div>

          <div className="px-6 py-4 bg-surface-50 border-b border-surface-200 border-t border-surface-200">
            <h2 className="font-semibold text-ink-800">Operations</h2>
          </div>
          <div className="px-6">
            <SettingRow label="Alert Radius (km)" description="Radius used for nearby incident alerts.">
              <input
                type="number"
                min={1} max={500}
                value={settings?.alertRadiusKm || 50}
                onChange={e => set('alertRadiusKm', Number(e.target.value))}
                className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </SettingRow>
            <SettingRow label="Max Incidents Per Page" description="Pagination limit for incident lists.">
              <input
                type="number"
                min={5} max={100}
                value={settings?.maxIncidentsPerPage || 20}
                onChange={e => set('maxIncidentsPerPage', Number(e.target.value))}
                className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </SettingRow>
          </div>

          <div className="px-6 py-4 bg-surface-50 border-b border-surface-200 border-t border-surface-200">
            <h2 className="font-semibold text-ink-800">Platform Controls</h2>
          </div>
          <div className="px-6">
            <SettingRow label="Maintenance Mode" description="Puts the platform in maintenance mode. Users cannot log in.">
              <Toggle value={!!settings?.maintenanceMode} onChange={v => set('maintenanceMode', v)} />
            </SettingRow>
            <SettingRow label="Allow New Registrations" description="Controls whether new users can register.">
              <Toggle value={!!settings?.allowRegistrations} onChange={v => set('allowRegistrations', v)} />
            </SettingRow>
            <SettingRow label="Notifications Enabled" description="Enable/disable the notification system.">
              <Toggle value={!!settings?.notificationsEnabled} onChange={v => set('notificationsEnabled', v)} />
            </SettingRow>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-60 transition font-medium"
          >
            <LuSave size={16} />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

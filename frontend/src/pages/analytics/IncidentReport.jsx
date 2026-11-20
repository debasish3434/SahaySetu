import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
} from 'recharts';
import api from '../../api/axios.js';
import PageLoader from '../../components/common/PageLoader.jsx';

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const exportCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const rows = [Object.keys(data[0]), ...data.map(r => Object.values(r))];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function IncidentReport() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    api.get('/analytics/incidents')
      .then(res => setStats(res.data?.stats))
      .catch(err => setError(err.response?.data?.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <PageLoader />;
  if (error) return (
    <div className="p-6 text-center">
      <p className="text-red-600 font-semibold mb-3">{error}</p>
      <button onClick={load} className="px-4 py-2 bg-brand-600 text-white rounded-lg">Retry</button>
    </div>
  );

  // Backend returns byStatus as object: { reported:3, verified:1, 'in-progress':2, resolved:5, rejected:0 }
  const byStatusObj = stats?.byStatus || {};
  const statusPieData = Object.entries(byStatusObj).map(([k, v]) => ({ name: k, value: v }));

  // Backend returns byCategory as object: { flood:3, fire:2, ... }
  const byCatObj = stats?.byCategory || {};
  const categoryData = Object.entries(byCatObj).map(([k, v]) => ({ name: k, count: v }));

  // Backend returns bySeverity as object: { low:1, medium:3, high:2, critical:1 }
  const bySevObj = stats?.bySeverity || {};
  const severityData = Object.entries(bySevObj).map(([k, v]) => ({ name: k, count: v }));

  // Backend returns byMonth as array: [{ year:2026, month:5, count:3 }, ...]
  const monthData = (stats?.byMonth || []).map(m => ({
    month: `${MONTH_NAMES[(m.month || 1) - 1]} ${m.year || ''}`,
    incidents: m.count,
  }));

  const exportData = categoryData.map(c => ({ category: c.name, count: c.count }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/analytics" className="hover:text-brand-600">Analytics</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Incident Report</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Incident Report</h1>
          <p className="text-gray-500 text-sm mt-1">Detailed analytics on all incidents</p>
        </div>
        <button
          onClick={() => exportCSV(exportData.length ? exportData : [{ noData: 'true' }], 'incident-report.csv')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats?.total, color: '#3B82F6' },
          { label: 'Reported', value: byStatusObj.reported, color: '#F59E0B' },
          { label: 'Verified', value: byStatusObj.verified, color: '#06B6D4' },
          { label: 'In Progress', value: byStatusObj['in-progress'], color: '#8B5CF6' },
          { label: 'Resolved', value: byStatusObj.resolved, color: '#10B981' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl shadow p-4 border-l-4" style={{ borderColor: color }}>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color }}>{value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">By Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-64 flex items-center justify-center text-gray-400">No data</div>}
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">By Status</h2>
          {statusPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-64 flex items-center justify-center text-gray-400">No data</div>}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">By Severity</h2>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {severityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-64 flex items-center justify-center text-gray-400">No data</div>}
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Monthly Trend</h2>
          {monthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="incidents" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-64 flex items-center justify-center text-gray-400">No data</div>}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuUsers, LuClipboardCheck, LuTrendingUp, LuUserCheck } from 'react-icons/lu';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import api from '../../api/axios.js';
import PageLoader from '../../components/common/PageLoader.jsx';

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

const exportCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const rows = [Object.keys(data[0]), ...data.map(r => Object.values(r))];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const SummaryCard = ({ label, value, color, icon: Icon }) => (
  <div className="bg-white rounded-xl shadow p-5 border-l-4" style={{ borderColor: color }}>
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value ?? 0}</p>
      </div>
    </div>
  </div>
);

export default function VolunteerReport() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    api.get('/analytics/volunteers')
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

  const topVolunteers = stats?.topVolunteers || [];
  const topData = topVolunteers.map(v => ({ name: v.name || v.email || 'Unknown', tasks: v.tasksCompleted || 0 }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/analytics" className="hover:text-brand-600">Analytics</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Volunteer Report</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Volunteer Performance</h1>
          <p className="text-gray-500 text-sm mt-1">Task completion and volunteer activity metrics</p>
        </div>
        <button
          onClick={() => exportCSV(topData.length ? topData : [{ noData: 'true' }], 'volunteer-report.csv')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm font-medium"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Volunteers" value={stats?.total} color="#3B82F6" icon={LuUsers} />
        <SummaryCard label="Verified" value={stats?.verified} color="#10B981" icon={LuUserCheck} />
        <SummaryCard label="Tasks Completed" value={stats?.tasksCompleted} color="#8B5CF6" icon={LuClipboardCheck} />
        <SummaryCard label="In Progress" value={stats?.tasksInProgress} color="#F59E0B" icon={LuTrendingUp} />
      </div>

      {/* Top Volunteers Chart */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Top Volunteers by Tasks Completed</h2>
        {topData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="tasks" radius={[0, 4, 4, 0]}>
                {topData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">No completed tasks yet</div>
        )}
      </div>

      {/* Top Volunteers Table */}
      {topData.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">Volunteer Leaderboard</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left font-medium">#</th>
                <th className="px-5 py-3 text-left font-medium">Volunteer</th>
                <th className="px-5 py-3 text-left font-medium">Tasks Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topVolunteers.map((v, i) => (
                <tr key={v._id || i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-bold text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{v.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{v.email || ''}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                      {v.tasksCompleted || 0} tasks
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

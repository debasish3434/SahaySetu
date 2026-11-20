import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuPackage, LuTriangleAlert, LuCircleCheck } from 'react-icons/lu';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import api from '../../api/axios.js';
import PageLoader from '../../components/common/PageLoader.jsx';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

const exportCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const rows = [Object.keys(data[0]), ...data.map(r => Object.values(r))];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function ResourceReport() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    api.get('/analytics/resources')
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

  const byStatus = stats?.byStatus || {};
  const statusPieData = Object.entries(byStatus).map(([k, v]) => ({ name: k, value: v }));

  const byCategory = stats?.byCategory || {};
  const categoryData = Object.entries(byCategory).map(([k, v]) => ({
    name: k, count: typeof v === 'object' ? v.count : v,
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
            <span className="text-gray-700 font-medium">Resource Report</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Resource Utilization</h1>
          <p className="text-gray-500 text-sm mt-1">Relief resource availability and category breakdown</p>
        </div>
        <button
          onClick={() => exportCSV(exportData.length ? exportData : [{ noData: 'true' }], 'resource-report.csv')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm font-medium"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Resources', value: stats?.total, color: '#3B82F6', Icon: LuPackage },
          { label: 'Available', value: byStatus.available, color: '#10B981', Icon: LuCircleCheck },
          { label: 'Low Stock', value: byStatus.low, color: '#F59E0B', Icon: LuTriangleAlert },
          { label: 'Depleted', value: byStatus.depleted, color: '#EF4444', Icon: LuPackage },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-white rounded-xl shadow p-5 border-l-4" style={{ borderColor: color }}>
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
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Resources by Status</h2>
          {statusPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={110} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-72 flex items-center justify-center text-gray-400">No data</div>}
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Resources by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-72 flex items-center justify-center text-gray-400">No data</div>}
        </div>
      </div>
    </div>
  );
}

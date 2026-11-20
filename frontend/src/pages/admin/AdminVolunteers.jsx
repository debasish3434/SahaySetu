import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LuUsers, LuSearch, LuX } from 'react-icons/lu';
import api from '../../api/axios.js';
import { timeAgo } from '../../utils/formatters.js';
import PageLoader from '../../components/common/PageLoader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  unverified: 'bg-ink-100 text-ink-600',
  pending:    'bg-warning-100 text-warning-700',
  verified:   'bg-success-100 text-success-700',
  rejected:   'bg-danger-100 text-danger-700',
};

export default function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { role: 'volunteer', page, limit: 15 };
      if (search) params.search = search;
      const { data } = await api.get('/admin/volunteers', { params });
      let users = data.users || [];
      if (statusFilter) {
        users = users.filter(u => u.volunteerProfile?.verificationStatus === statusFilter);
      }
      setVolunteers(users);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleVerify = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/volunteers/${id}/verify`, { decision: status });
      toast.success(`Volunteer ${status}`);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
            <LuUsers className="text-brand-600" size={24} /> Manage Volunteers
          </h1>
          <p className="text-ink-500 text-sm mt-0.5">{total} registered volunteers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <LuSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="pl-9 pr-4 py-2 w-full border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
              <LuX size={14} />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="unverified">Unverified</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : volunteers.length === 0 ? (
        <EmptyState icon={LuUsers} title="No volunteers found" message="No volunteers match your filters." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-50 text-ink-500 border-b border-surface-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Volunteer</th>
                  <th className="px-4 py-3 font-medium">Skills</th>
                  <th className="px-4 py-3 font-medium">Availability</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Registered</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {volunteers.map(v => {
                  const vs = v.volunteerProfile?.verificationStatus || 'unverified';
                  return (
                    <tr key={v._id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-900">{v.name}</p>
                        <p className="text-xs text-ink-500">{v.email}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-600 max-w-32">
                        <span className="line-clamp-1">
                          {v.volunteerProfile?.skills?.join(', ') || <span className="text-ink-400 italic">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {v.volunteerProfile?.availability || <span className="text-ink-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[vs]}`}>
                          {vs}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-500 text-xs">{timeAgo(v.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {vs !== 'verified' && (
                            <button
                              onClick={() => handleVerify(v._id, 'verified')}
                              disabled={updating === v._id}
                              className="px-2 py-1 bg-success-600 text-white rounded text-xs hover:bg-success-700 disabled:opacity-50"
                            >
                              {updating === v._id ? '…' : 'Verify'}
                            </button>
                          )}
                          {vs !== 'rejected' && (
                            <button
                              onClick={() => handleVerify(v._id, 'rejected')}
                              disabled={updating === v._id}
                              className="px-2 py-1 bg-danger-600 text-white rounded text-xs hover:bg-danger-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex justify-center items-center gap-3 p-4 border-t border-surface-200">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-ink-200 rounded text-sm disabled:opacity-40">Previous</button>
              <span className="text-sm text-ink-600">Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-ink-200 rounded text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LuList } from 'react-icons/lu';
import { getIncidentsApi } from '../../api/incidentApi.js';
import { unwrapIncidentsList, getReporterName } from '../../utils/apiHelpers.js';
import SearchBar from '../../components/common/SearchBar.jsx';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge.jsx';
import PageLoader from '../../components/common/PageLoader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters.js';
import { CATEGORY_LABELS } from '../../utils/constants.js';

const CoordinatorIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const navigate = useNavigate();

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIncidentsApi({ search, status: statusFilter, page, limit });
      const { incidents, totalPages: pages } = unwrapIncidentsList(res);
      setIncidents(incidents);
      setTotalPages(pages);
    } catch (err) {
      toast.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-ink-900">Incident Management</h1>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search incidents..." />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-surface-200 rounded-md focus:border-brand-500 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="verified">Verified</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        {loading ? <PageLoader /> : incidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-50 border-b border-surface-200 text-ink-500 text-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reporter</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {incidents.map((incident) => (
                  <tr key={incident._id} onClick={() => navigate(`/incident-management/${incident._id}`)} className="cursor-pointer hover:bg-surface-50">
                    <td className="px-4 py-3">{CATEGORY_LABELS[incident.category] || incident.category}</td>
                    <td className="px-4 py-3 font-medium text-ink-900 truncate max-w-[200px]">{incident.title}</td>
                    <td className="px-4 py-3"><SeverityBadge severity={incident.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={incident.status} /></td>
                    <td className="px-4 py-3 truncate max-w-[150px]">{getReporterName(incident)}</td>
                    <td className="px-4 py-3 text-sm text-ink-600">{formatDate(incident.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded bg-surface-100 disabled:opacity-50">Prev</button>
                <span className="px-3 py-1 text-ink-600">Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded bg-surface-100 disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState title="No incidents found" message="No incidents match your criteria." icon={LuList} />
        )}
      </div>
    </motion.div>
  );
};

export default CoordinatorIncidents;

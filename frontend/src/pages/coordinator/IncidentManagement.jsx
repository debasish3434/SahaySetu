import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getIncidentsApi } from '../../api/incidentApi.js';
import PageLoader from '../../components/common/PageLoader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { formatDate } from '../../utils/formatters.js';
import toast from 'react-hot-toast';

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await getIncidentsApi({ page, limit: 10, search, status: statusFilter });
        if (response.data.success) {
          setIncidents(response.data.incidents || []);
        }
      } catch (error) {
        toast.error('Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, [page, search, statusFilter]);

  if (loading && incidents.length === 0) return <PageLoader label="Loading incidents..." />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">Incident Management</h1>
        <p className="text-ink-500">Manage and monitor all reported incidents.</p>
      </div>

      <div className="card p-4 flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Search incidents..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-surface-200 rounded-md focus:outline-none focus:border-brand-500 text-sm"
        />
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-surface-200 rounded-md focus:outline-none focus:border-brand-500 text-sm min-w-[200px]"
        >
          <option value="">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="verified">Verified</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {incidents.length === 0 ? (
        <EmptyState title="No Incidents Found" description="There are no incidents matching your criteria." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="p-4 text-xs font-medium text-ink-500 uppercase">Title</th>
                  <th className="p-4 text-xs font-medium text-ink-500 uppercase">Category</th>
                  <th className="p-4 text-xs font-medium text-ink-500 uppercase">Date</th>
                  <th className="p-4 text-xs font-medium text-ink-500 uppercase">Location</th>
                  <th className="p-4 text-xs font-medium text-ink-500 uppercase">Severity</th>
                  <th className="p-4 text-xs font-medium text-ink-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(incident => (
                  <tr 
                    key={incident._id} 
                    onClick={() => navigate(`/incident-management/${incident._id}`)}
                    className="border-b border-surface-200 hover:bg-surface-50 cursor-pointer transition-colors"
                  >
                    <td className="p-4 text-sm text-ink-900 font-medium">{incident.title}</td>
                    <td className="p-4 text-sm text-ink-700 capitalize">{incident.category}</td>
                    <td className="p-4 text-sm text-ink-500">{formatDate(incident.createdAt)}</td>
                    <td className="p-4 text-sm text-ink-700 truncate max-w-[200px]">{incident.location?.address}</td>
                    <td className="p-4"><StatusBadge type="severity" value={incident.severity} /></td>
                    <td className="p-4"><StatusBadge type="status" value={incident.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="md:hidden space-y-4 p-4">
            {incidents.map(incident => (
              <div 
                key={incident._id} 
                onClick={() => navigate(`/incident-management/${incident._id}`)}
                className="border border-surface-200 rounded-md p-4 space-y-3 cursor-pointer hover:bg-surface-50"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-ink-900">{incident.title}</h3>
                  <StatusBadge type="status" value={incident.status} />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-ink-500">{formatDate(incident.createdAt)}</span>
                  <StatusBadge type="severity" value={incident.severity} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {incidents.length >= 10 && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-surface-200 rounded-md text-ink-700 hover:bg-surface-50 text-sm font-medium"
          >
            Load More
          </button>
        </div>
      )}
    </motion.div>
  );
};
export default IncidentManagement;

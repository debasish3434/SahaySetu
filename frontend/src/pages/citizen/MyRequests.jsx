import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuCircleAlert, LuPlus, LuClock, LuMapPin } from 'react-icons/lu';
import { getMyRequestsApi } from '../../api/requestApi.js';
import PageLoader from '../../components/common/PageLoader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatDate } from '../../utils/formatters.js';

const PRIORITY_STYLES = {
  critical: 'bg-danger-100 text-danger-700 border border-danger-200',
  high: 'bg-warning-100 text-warning-700 border border-warning-200',
  medium: 'bg-accent-100 text-accent-700 border border-accent-200',
  low: 'bg-success-100 text-success-700 border border-success-200',
};

const STATUS_STYLES = {
  submitted: 'bg-surface-100 text-ink-600',
  prioritized: 'bg-brand-100 text-brand-700',
  assigned: 'bg-accent-100 text-accent-700',
  'in-progress': 'bg-warning-100 text-warning-700',
  completed: 'bg-success-100 text-success-700',
  closed: 'bg-surface-200 text-ink-500',
};

const REQUEST_TYPE_LABELS = {
  medical: 'Medical Emergency',
  rescue: 'Rescue / Evacuation',
  food_water: 'Food & Water',
  shelter: 'Shelter',
  evacuation: 'Evacuation',
  other: 'Other',
};

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data } = await getMyRequestsApi();
        setRequests(data.requests || []);
      } catch (err) {
        toast.error('Failed to load your emergency requests');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  if (loading) return <PageLoader label="Loading your requests..." />;

  const activeCount = requests.filter(r => r.status !== 'closed').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">My Emergency Requests</h1>
          <p className="text-ink-500 text-sm mt-1">
            {activeCount} active · {requests.length} total
          </p>
        </div>
        <Link
          to="/emergency-request"
          className="inline-flex items-center gap-2 px-4 py-2 bg-danger-600 text-white rounded-md hover:bg-danger-700 transition-colors text-sm font-medium"
        >
          <LuPlus size={16} />
          New Emergency Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={LuCircleAlert}
          title="No Emergency Requests"
          description="You haven't submitted any emergency requests yet. Use the button above to create one."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLES[req.priority] || 'bg-surface-100 text-ink-600'}`}>
                      {req.priority?.toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[req.status] || 'bg-surface-100 text-ink-600'}`}>
                      {req.status?.replace('-', ' ')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                      {REQUEST_TYPE_LABELS[req.requestType] || req.requestType}
                    </span>
                  </div>

                  <p className="text-ink-700 text-sm mt-1 leading-relaxed">
                    {req.description?.substring(0, 200)}{req.description?.length > 200 ? '...' : ''}
                  </p>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-ink-500">
                    {req.location?.address && (
                      <span className="flex items-center gap-1">
                        <LuMapPin size={11} /> {req.location.address}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <LuClock size={11} /> Submitted: {formatDate(req.createdAt)}
                    </span>
                    {req.contactPhone && (
                      <span>Contact: {req.contactPhone}</span>
                    )}
                    {req.peopleCount && (
                      <span>People: {req.peopleCount}</span>
                    )}
                  </div>
                </div>

                {req.assignedVolunteer && (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-3 text-xs min-w-[160px]">
                    <p className="font-semibold text-success-700 mb-1">Assigned Volunteer</p>
                    <p className="text-ink-700">{req.assignedVolunteer.name}</p>
                    <p className="text-ink-500">{req.assignedVolunteer.phone}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MyRequests;

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  LuCircleAlert, LuX, LuLoader, LuUserCheck, LuFilter
} from 'react-icons/lu';
import {
  getAllRequestsApi,
  updateRequestPriorityApi,
  assignVolunteerToRequestApi,
  updateRequestStatusApi,
} from '../../api/requestApi.js';
import { getVerifiedVolunteersApi } from '../../api/volunteerApi.js';
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
  closed: 'bg-surface-200 text-ink-500 line-through',
};
const REQUEST_TYPE_LABELS = {
  medical: 'Medical Emergency', rescue: 'Rescue', food_water: 'Food & Water',
  shelter: 'Shelter', evacuation: 'Evacuation', other: 'Other',
};

const EmergencyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, volRes] = await Promise.all([
        getAllRequestsApi({ status: statusFilter || undefined, priority: priorityFilter || undefined }),
        getVerifiedVolunteersApi(),
      ]);
      const sorted = (reqRes.data?.requests || []).sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      });
      setRequests(sorted);
      setVolunteers(volRes.data?.volunteers || []);
    } catch (err) {
      toast.error('Failed to load emergency requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (req) => {
    setSelectedReq(req);
    setEditPriority(req.priority);
    setEditStatus(req.status);
    setSelectedVolunteer(req.assignedVolunteer?._id || '');
    setConfirmClose(false);
  };
  const closeModal = () => { setSelectedReq(null); setConfirmClose(false); };

  const handleUpdatePriority = async () => {
    if (!editPriority || editPriority === selectedReq.priority) return;
    setModalLoading(true);
    try {
      await updateRequestPriorityApi(selectedReq._id, editPriority);
      toast.success(`Priority updated to ${editPriority}`);
      closeModal(); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update priority'); }
    finally { setModalLoading(false); }
  };

  const handleUpdateStatus = async () => {
    if (!editStatus || editStatus === selectedReq.status) return;
    setModalLoading(true);
    try {
      await updateRequestStatusApi(selectedReq._id, editStatus);
      toast.success(`Status updated to ${editStatus}`);
      closeModal(); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status'); }
    finally { setModalLoading(false); }
  };

  const handleAssignVolunteer = async () => {
    if (!selectedVolunteer) { toast.error('Please select a volunteer'); return; }
    setModalLoading(true);
    try {
      await assignVolunteerToRequestApi(selectedReq._id, selectedVolunteer);
      toast.success('Volunteer assigned successfully!');
      closeModal(); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign volunteer'); }
    finally { setModalLoading(false); }
  };

  const handleCloseRequest = async () => {
    setModalLoading(true);
    try {
      await updateRequestStatusApi(selectedReq._id, 'closed');
      toast.success('Request closed successfully');
      closeModal(); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to close request'); }
    finally { setModalLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Emergency Requests</h1>
          <p className="text-ink-500 text-sm">SS-39/41/42/43/44 — Manage, prioritize and assign volunteers to requests</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-ink-500">
          <LuFilter size={12} /> {requests.length} requests
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-ink-600">Status:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs text-ink-800 focus:border-brand-500 focus:outline-none">
            <option value="">All</option>
            {['submitted','prioritized','assigned','in-progress','completed','closed'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-ink-600">Priority:</label>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs text-ink-800 focus:border-brand-500 focus:outline-none">
            <option value="">All</option>
            {['critical','high','medium','low'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <PageLoader /> : requests.length === 0 ? (
          <EmptyState icon={LuCircleAlert} title="No Emergency Requests" description="No requests match your filter criteria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 text-ink-500 text-xs uppercase border-b border-surface-200">
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Requester</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned To</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-ink-900 text-sm">
                      {REQUEST_TYPE_LABELS[req.requestType] || req.requestType}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">{req.requestedBy?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLES[req.priority] || ''}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[req.status] || ''}`}>
                        {req.status?.replace('-',' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">
                      {req.assignedVolunteer?.name || <span className="text-ink-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">{formatDate(req.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openModal(req)}
                        className="px-3 py-1 text-xs font-medium text-brand-600 border border-brand-200 rounded-md hover:bg-brand-50 transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-surface-200">
              <div>
                <h2 className="text-xl font-bold text-ink-900">Manage Emergency Request</h2>
                <p className="text-xs text-ink-500 mt-0.5">{REQUEST_TYPE_LABELS[selectedReq.requestType]} · {formatDate(selectedReq.createdAt)}</p>
              </div>
              <button onClick={closeModal} className="text-ink-400 hover:text-ink-600 transition-colors"><LuX size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-ink-500 mb-1">REQUESTER</p>
                  <p className="text-ink-900">{selectedReq.requestedBy?.name}</p>
                  <p className="text-ink-500 text-xs">{selectedReq.requestedBy?.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-500 mb-1">PEOPLE AFFECTED</p>
                  <p className="text-ink-900">{selectedReq.peopleCount || 1}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-ink-500 mb-1">DESCRIPTION</p>
                  <p className="text-ink-700 bg-surface-50 rounded-lg p-3 text-sm">{selectedReq.description}</p>
                </div>
                {selectedReq.location?.address && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-ink-500 mb-1">LOCATION</p>
                    <p className="text-ink-700">{selectedReq.location.address}</p>
                  </div>
                )}
              </div>

              {/* SS-41: Priority Update */}
              <div className="border-t border-surface-200 pt-4">
                <p className="text-sm font-semibold text-ink-700 mb-2">Update Priority (SS-41)</p>
                <div className="flex gap-2">
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value)}
                    className="flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none">
                    {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button onClick={handleUpdatePriority} disabled={modalLoading || editPriority === selectedReq.priority}
                    className="px-4 py-2 bg-warning-600 text-white text-sm rounded-lg hover:bg-warning-700 disabled:opacity-50 transition-colors">
                    Update
                  </button>
                </div>
              </div>

              {/* SS-43: Status Update */}
              <div className="border-t border-surface-200 pt-4">
                <p className="text-sm font-semibold text-ink-700 mb-2">Update Status (SS-43)</p>
                <div className="flex gap-2">
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                    className="flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none">
                    {['submitted','prioritized','assigned','in-progress','completed','closed'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button onClick={handleUpdateStatus} disabled={modalLoading || editStatus === selectedReq.status}
                    className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">
                    Update
                  </button>
                </div>
              </div>

              {/* SS-42: Assign Volunteer */}
              {selectedReq.status !== 'closed' && (
                <div className="border-t border-surface-200 pt-4">
                  <p className="text-sm font-semibold text-ink-700 mb-2">Assign Volunteer (SS-42)</p>
                  {volunteers.length === 0 ? (
                    <p className="text-xs text-ink-400 italic">No verified volunteers available.</p>
                  ) : (
                    <div className="flex gap-2">
                      <select value={selectedVolunteer} onChange={e => setSelectedVolunteer(e.target.value)}
                        className="flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none">
                        <option value="">Select a volunteer...</option>
                        {volunteers.map(v => (
                          <option key={v._id} value={v._id}>
                            {v.name} — {v.phone || v.email} {v.volunteerProfile?.skills?.length ? `(${v.volunteerProfile.skills.slice(0,2).join(', ')})` : ''}
                          </option>
                        ))}
                      </select>
                      <button onClick={handleAssignVolunteer} disabled={modalLoading || !selectedVolunteer}
                        className="px-4 py-2 bg-success-600 text-white text-sm rounded-lg hover:bg-success-700 disabled:opacity-50 transition-colors flex items-center gap-1">
                        <LuUserCheck size={14} /> Assign
                      </button>
                    </div>
                  )}
                  {selectedReq.assignedVolunteer && (
                    <p className="mt-2 text-xs text-success-700 bg-success-50 rounded px-2 py-1">
                      Currently assigned: {selectedReq.assignedVolunteer.name}
                    </p>
                  )}
                </div>
              )}

              {/* SS-44: Close Request */}
              {selectedReq.status !== 'closed' && (
                <div className="border-t border-surface-200 pt-4">
                  <p className="text-sm font-semibold text-ink-700 mb-2">Close Request (SS-44)</p>
                  {!confirmClose ? (
                    <button onClick={() => setConfirmClose(true)}
                      className="px-4 py-2 bg-surface-100 text-ink-600 text-sm rounded-lg border border-surface-300 hover:bg-danger-50 hover:text-danger-700 hover:border-danger-200 transition-colors">
                      Close This Request
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 bg-danger-50 border border-danger-200 rounded-lg p-3">
                      <p className="text-xs text-danger-700 flex-1">Are you sure? This will permanently close the request.</p>
                      <button onClick={handleCloseRequest} disabled={modalLoading}
                        className="px-3 py-1.5 bg-danger-600 text-white text-xs rounded-md hover:bg-danger-700 disabled:opacity-50 transition-colors flex items-center gap-1">
                        {modalLoading ? <LuLoader size={12} className="animate-spin" /> : null} Confirm Close
                      </button>
                      <button onClick={() => setConfirmClose(false)} className="text-ink-400 hover:text-ink-600 text-xs">Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EmergencyRequests;

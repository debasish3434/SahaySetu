import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import {
  LuMapPin,
  LuClock,
  LuUser,
  LuPhone,
  LuUsers,
  LuCheck,
  LuPlay,
  LuArrowLeft,
  LuUserCheck,
  LuShieldAlert,
} from 'react-icons/lu';
import { useAuth } from '../hooks/useAuth.js';
import {
  getIncidentByIdApi,
  updateIncidentStatusApi,
  assignVolunteerApi,
  acceptTaskApi,
  updateTaskStatusApi,
} from '../api/incidentApi.js';
import { getVerifiedVolunteersApi } from '../api/volunteerApi.js';
import PageLoader from '../components/common/PageLoader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import { StatusBadge, SeverityBadge } from '../components/common/StatusBadge.jsx';
import { CATEGORY_LABELS } from '../utils/constants.js';
import { formatDate } from '../utils/formatters.js';

// Leaflet marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TASK_STATUS_TONE = {
  unassigned: 'neutral',
  assigned: 'warning',
  accepted: 'brand',
  'in-progress': 'accent',
  completed: 'success',
};

const TASK_STATUS_LABELS = {
  unassigned: 'Unassigned',
  assigned: 'Assigned',
  accepted: 'Accepted',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

const IncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Volunteer list for coordinators/admins
  const [verifiedVolunteers, setVerifiedVolunteers] = useState([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');

  const fetchIncident = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getIncidentByIdApi(id);
      setIncident(data.incident);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load incident details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchVolunteers = useCallback(async () => {
    if (['coordinator', 'admin'].includes(user?.role)) {
      try {
        const { data } = await getVerifiedVolunteersApi();
        setVerifiedVolunteers(data.volunteers || []);
      } catch (err) {
        // silent fail if volunteers query has issue
      }
    }
  }, [user?.role]);

  useEffect(() => {
    fetchIncident();
    fetchVolunteers();
  }, [fetchIncident, fetchVolunteers]);

  const handleStatusUpdate = async (newStatus) => {
    setActionLoading(true);
    try {
      const { data } = await updateIncidentStatusApi(id, newStatus);
      setIncident(data.incident);
      toast.success(`Incident status updated to '${newStatus}'`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignVolunteer = async () => {
    if (!selectedVolunteerId) {
      toast.error('Please select a verified volunteer');
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await assignVolunteerApi(id, selectedVolunteerId);
      setIncident(data.incident);
      toast.success('Volunteer assigned successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign volunteer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptTask = async () => {
    setActionLoading(true);
    try {
      const { data } = await acceptTaskApi(id);
      setIncident(data.incident);
      toast.success('Task accepted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTaskStatusUpdate = async (nextTaskStatus) => {
    setActionLoading(true);
    try {
      const { data } = await updateTaskStatusApi(id, nextTaskStatus);
      setIncident(data.incident);
      toast.success(`Task status updated to '${nextTaskStatus}'`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading incident details…" />;
  }

  if (!incident) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <EmptyState
          icon={LuShieldAlert}
          title="Incident Not Found"
          description="The requested incident could not be found or has been removed."
        />
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate('/dashboard')} className="!w-auto">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isCoordinatorOrAdmin = ['coordinator', 'admin'].includes(user?.role);
  const isAssignedVolunteer =
    user?.role === 'volunteer' &&
    (incident.assignedVolunteer?._id === user._id || incident.assignedVolunteer === user._id);

  const [lng, lat] = incident.location?.coordinates || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-4xl space-y-6"
    >
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-brand-600"
      >
        <LuArrowLeft size={14} /> Back
      </button>

      {/* Title & Badges */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-600">
            {CATEGORY_LABELS[incident.category] || incident.category}
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={incident.status} />
            <SeverityBadge severity={incident.severity} />
            {incident.taskStatus && (
              <Badge tone={TASK_STATUS_TONE[incident.taskStatus] || 'neutral'}>
                Task: {TASK_STATUS_LABELS[incident.taskStatus] || incident.taskStatus}
              </Badge>
            )}
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-ink-900">{incident.title}</h1>

        <div className="grid grid-cols-1 gap-3 pt-2 text-xs text-ink-600 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <LuClock className="text-ink-400" size={16} />
            <span>Reported {formatDate(incident.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <LuUser className="text-ink-400" size={16} />
            <span>By: {incident.reportedBy?.name || 'Anonymous Citizen'}</span>
          </div>
          {incident.contactPhone && (
            <div className="flex items-center gap-2">
              <LuPhone className="text-ink-400" size={16} />
              <span>Contact: {incident.contactPhone}</span>
            </div>
          )}
          {incident.peopleAffected > 0 && (
            <div className="flex items-center gap-2 sm:col-span-3">
              <LuUsers className="text-ink-400" size={16} />
              <span>People Affected: Approx. {incident.peopleAffected}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="card">
        <h2 className="font-display text-base font-bold text-ink-900">Incident Description</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-700 whitespace-pre-line">
          {incident.description}
        </p>
      </div>

      {/* Location Map */}
      {lat && lng && (
        <div className="card">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900">
            <LuMapPin className="text-brand-600" size={18} /> Location & Address
          </div>
          <p className="mb-3 text-xs text-ink-600">{incident.location?.address || 'No landmark provided'}</p>
          <div className="overflow-hidden rounded-xl border border-ink-200">
            <MapContainer center={[lat, lng]} zoom={14} style={{ height: '260px', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[lat, lng]}>
                <Popup>{incident.title}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* Media Gallery (Photos & Videos) */}
      {(incident.media?.length > 0 || incident.photos?.length > 0) && (
        <div className="card">
          <h2 className="mb-4 font-display text-base font-bold text-ink-900">Photos & Media Evidence</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(incident.media || incident.photos || []).map((item, idx) => {
              const isVideo = item.type === 'video' || item.url?.match(/\.(mp4|mov|webm)$/i);
              return isVideo ? (
                <div key={idx} className="overflow-hidden rounded-xl border border-ink-200 bg-black aspect-video">
                  <video src={item.url} controls className="h-full w-full object-contain" />
                </div>
              ) : (
                <div key={idx} className="overflow-hidden rounded-xl border border-ink-200 aspect-video bg-ink-100">
                  <img src={item.url} alt={`Evidence ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assigned Volunteer Details */}
      {incident.assignedVolunteer && (
        <div className="card bg-brand-50/50 border-brand-200">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-brand-900">
            <LuUserCheck size={18} /> Assigned Response Volunteer
          </h2>
          <div className="mt-3 flex items-center justify-between text-sm text-brand-800">
            <div>
              <p className="font-semibold">{incident.assignedVolunteer.name}</p>
              <p className="text-xs text-brand-700">{incident.assignedVolunteer.email}</p>
              {incident.assignedVolunteer.phone && (
                <p className="text-xs text-brand-700">Phone: {incident.assignedVolunteer.phone}</p>
              )}
            </div>
            <Badge tone={TASK_STATUS_TONE[incident.taskStatus] || 'neutral'}>
              {TASK_STATUS_LABELS[incident.taskStatus] || incident.taskStatus}
            </Badge>
          </div>
        </div>
      )}

      {/* Actions: Coordinator / Admin Controls */}
      {isCoordinatorOrAdmin && (
        <div className="card space-y-5 border-brand-200 bg-brand-50/30">
          <h2 className="font-display text-base font-bold text-ink-900">Coordinator Actions</h2>

          {/* Status lifecycle update */}
          <div>
            <label className="form-label">Incident Lifecycle Status</label>
            <div className="flex flex-wrap gap-2">
              {['verified', 'resolved', 'rejected'].map((st) => (
                <Button
                  key={st}
                  variant={st === 'resolved' ? 'primary' : st === 'rejected' ? 'danger' : 'outline'}
                  className="!w-auto !py-1.5 !px-3 text-xs"
                  loading={actionLoading}
                  disabled={incident.status === st}
                  onClick={() => handleStatusUpdate(st)}
                >
                  Mark as {st.charAt(0).toUpperCase() + st.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Volunteer Assignment */}
          <div className="border-t border-ink-100 pt-4">
            <label className="form-label">Assign Verified Volunteer</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedVolunteerId}
                onChange={(e) => setSelectedVolunteerId(e.target.value)}
                className="flex-1 rounded-xl border border-ink-300 bg-white px-3.5 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
              >
                <option value="">Select a verified volunteer…</option>
                {verifiedVolunteers.map((vol) => (
                  <option key={vol._id} value={vol._id}>
                    {vol.name} ({vol.volunteerProfile?.skills?.join(', ') || 'No skills listed'})
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAssignVolunteer}
                loading={actionLoading}
                className="!w-auto"
              >
                Assign Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Actions: Assigned Volunteer Controls */}
      {isAssignedVolunteer && (
        <div className="card space-y-4 border-accent-200 bg-accent-50/30">
          <h2 className="font-display text-base font-bold text-ink-900">My Task Action Center</h2>
          <p className="text-xs text-ink-600">
            Current Task Status:{' '}
            <strong className="capitalize">{incident.taskStatus}</strong>
          </p>

          <div className="flex flex-wrap gap-3">
            {incident.taskStatus === 'assigned' && (
              <Button
                variant="primary"
                loading={actionLoading}
                onClick={handleAcceptTask}
                className="!w-auto"
              >
                <LuCheck size={16} /> Accept Emergency Task
              </Button>
            )}

            {incident.taskStatus === 'accepted' && (
              <Button
                variant="primary"
                loading={actionLoading}
                onClick={() => handleTaskStatusUpdate('in-progress')}
                className="!w-auto"
              >
                <LuPlay size={16} /> Mark as In Progress
              </Button>
            )}

            {incident.taskStatus === 'in-progress' && (
              <Button
                variant="primary"
                loading={actionLoading}
                onClick={() => handleTaskStatusUpdate('completed')}
                className="!w-auto"
              >
                <LuCheck size={16} /> Mark Task Completed
              </Button>
            )}

            {incident.taskStatus === 'completed' && (
              <p className="text-xs font-semibold text-success-700">
                ✓ You have completed this assigned task. Thank you!
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default IncidentDetail;

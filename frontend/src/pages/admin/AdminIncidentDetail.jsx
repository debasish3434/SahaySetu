import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { LuArrowLeft, LuMapPin, LuCalendar, LuUser, LuPhone, LuUsers } from 'react-icons/lu';
import { getIncidentByIdApi } from '../../api/incidentApi.js';
import { unwrapIncident, getIncidentPhotoUrls, getReporterName } from '../../utils/apiHelpers.js';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge.jsx';
import PageLoader from '../../components/common/PageLoader.jsx';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters.js';
import { CATEGORY_LABELS } from '../../utils/constants.js';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const AdminIncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const res = await getIncidentByIdApi(id);
        setIncident(unwrapIncident(res));
      } catch (err) {
        toast.error('Failed to load incident details');
        navigate('/admin/incidents');
      } finally {
        setLoading(false);
      }
    };
    fetchIncident();
  }, [id, navigate]);

  if (loading || !incident) return <PageLoader />;

  const photoUrls = getIncidentPhotoUrls(incident);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/admin/incidents')} className="flex items-center gap-2 text-ink-600 hover:text-ink-900 transition-colors">
        <LuArrowLeft /> Back to Incident Monitoring
      </button>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-surface-200">
          <div className="flex flex-wrap gap-2 mb-3">
            <StatusBadge status={incident.status} />
            <SeverityBadge severity={incident.severity} />
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-ink-600">
              {CATEGORY_LABELS[incident.category] || incident.category}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-ink-900 mb-2">{incident.title}</h1>
          <div className="flex items-center gap-4 text-sm text-ink-500">
            <span className="flex items-center gap-1"><LuCalendar /> {formatDate(incident.createdAt)}</span>
            <span className="flex items-center gap-1"><LuMapPin /> {incident.location?.address}</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-ink-900 mb-2">Description</h3>
              <p className="text-ink-700 whitespace-pre-wrap">{incident.description}</p>
            </div>

            {photoUrls.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-ink-900 mb-2">Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {photoUrls.map((url, i) => (
                    <img key={i} src={url} alt={`Incident photo ${i + 1}`} className="w-full h-32 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-surface-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-ink-900">Details</h3>
              
              <div className="flex items-start gap-3">
                <LuUser className="text-ink-400 mt-0.5" />
                <div>
                  <p className="text-xs text-ink-500">Reporter</p>
                  <p className="text-sm font-medium text-ink-900">{getReporterName(incident)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <LuPhone className="text-ink-400 mt-0.5" />
                <div>
                  <p className="text-xs text-ink-500">Contact</p>
                  <p className="text-sm font-medium text-ink-900">{incident.contactPhone || 'N/A'}</p>
                </div>
              </div>

              {incident.peopleAffected && (
                <div className="flex items-start gap-3">
                  <LuUsers className="text-ink-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-ink-500">People Affected</p>
                    <p className="text-sm font-medium text-ink-900">{incident.peopleAffected}</p>
                  </div>
                </div>
              )}
            </div>

            {incident.location?.coordinates && (
              <div className="h-48 rounded-lg overflow-hidden border border-surface-200">
                <MapContainer center={[incident.location.coordinates[1], incident.location.coordinates[0]]} zoom={13} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[incident.location.coordinates[1], incident.location.coordinates[0]]}>
                    <Popup>{incident.location.address}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminIncidentDetail;

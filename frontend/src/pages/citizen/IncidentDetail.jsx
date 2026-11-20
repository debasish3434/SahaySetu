import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getIncidentByIdApi } from '../../api/incidentApi.js';
import PageLoader from '../../components/common/PageLoader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { formatDate } from '../../utils/formatters.js';
import toast from 'react-hot-toast';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CitizenIncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const response = await getIncidentByIdApi(id);
        if (response.data.success) {
          setIncident(response.data.incident);
        } else {
          toast.error('Failed to load incident details');
        }
      } catch (error) {
        toast.error('Error loading incident');
      } finally {
        setLoading(false);
      }
    };
    fetchIncident();
  }, [id]);

  if (loading) return <PageLoader label="Loading incident details..." />;
  if (!incident) return <div className="p-8 text-center text-ink-500">Incident not found</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-ink-500 hover:text-ink-900 text-sm font-medium flex items-center">
        &larr; Back
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-ink-900">{incident.title}</h1>
          <p className="text-sm text-ink-500 mt-1">Reported on {formatDate(incident.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge type="severity" value={incident.severity} />
          <StatusBadge type="status" value={incident.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-ink-900 mb-4">Description</h2>
            <p className="text-ink-700 whitespace-pre-wrap">{incident.description}</p>
          </div>

          {incident.photos && incident.photos.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-ink-900 mb-4">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {incident.photos.map((photo, idx) => (
                  <img key={idx} src={photo.url} alt={`Incident photo ${idx + 1}`} className="w-full h-32 object-cover rounded-md shadow-sm border border-surface-200" />
                ))}
              </div>
            </div>
          )}

          {incident.location && incident.location.coordinates && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-ink-900 mb-4">Location Map</h2>
              <div className="h-64 rounded-md overflow-hidden border border-surface-200">
                <MapContainer center={[incident.location.coordinates[1], incident.location.coordinates[0]]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[incident.location.coordinates[1], incident.location.coordinates[0]]}>
                    <Popup>{incident.location.address}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-bold text-ink-900 border-b border-surface-200 pb-2">Details</h2>
            
            <div>
              <span className="block text-xs font-medium text-ink-500 uppercase tracking-wider">Category</span>
              <span className="text-ink-900 capitalize font-medium">{incident.category}</span>
            </div>
            
            <div>
              <span className="block text-xs font-medium text-ink-500 uppercase tracking-wider">Address</span>
              <span className="text-ink-900">{incident.location?.address || 'N/A'}</span>
            </div>
            
            <div>
              <span className="block text-xs font-medium text-ink-500 uppercase tracking-wider">Contact Phone</span>
              <span className="text-ink-900">{incident.contactPhone || 'N/A'}</span>
            </div>
            
            <div>
              <span className="block text-xs font-medium text-ink-500 uppercase tracking-wider">People Affected</span>
              <span className="text-ink-900">{incident.peopleAffected || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default CitizenIncidentDetail;

import { LuMapPin, LuPhone, LuUser, LuMail } from 'react-icons/lu';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { StatusBadge, SeverityBadge } from '../common/StatusBadge.jsx';
import { CATEGORY_LABELS } from '../../utils/constants.js';
import { formatDate } from '../../utils/formatters.js';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const IncidentDetailView = ({ incident, actions }) => {
  if (!incident) return null;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-2">
              {CATEGORY_LABELS[incident.category] || incident.category}
            </div>
            <h1 className="text-2xl font-bold text-ink-900">{incident.title}</h1>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={incident.status} />
            <SeverityBadge severity={incident.severity} />
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-ink-700">
          <p className="whitespace-pre-wrap">{incident.description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-ink-100">
          {incident.peopleAffected && (
            <div className="flex items-center gap-2 text-sm text-ink-700">
              <span className="font-semibold">People Affected:</span>
              <span>{incident.peopleAffected}</span>
            </div>
          )}
          {incident.contactPhone && (
            <div className="flex items-center gap-2 text-sm text-ink-700">
              <LuPhone className="text-ink-500" size={16} />
              <span>{incident.contactPhone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Map & Location */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold text-ink-900">Location</h2>
        <div className="flex items-start gap-2 text-ink-700 mb-4">
          <LuMapPin className="shrink-0 mt-1 text-ink-500" size={18} />
          <span>{incident.address}</span>
        </div>
        {incident.location?.coordinates && (
          <div className="h-64 w-full rounded-lg overflow-hidden border border-ink-200">
            <MapContainer
              center={[incident.location.coordinates[1], incident.location.coordinates[0]]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[incident.location.coordinates[1], incident.location.coordinates[0]]} />
            </MapContainer>
          </div>
        )}
      </div>

      {/* Photos */}
      {incident.media && incident.media.length > 0 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-ink-900">Photos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {incident.media.map((item, index) => (
              <a key={index} href={item.url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-ink-100 hover:shadow-md transition">
                <img src={item.url} alt={`Incident media ${index + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Reporter Info */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold text-ink-900">Reported By</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <LuUser className="text-ink-500" size={16} />
            <span>{incident.reportedBy?.name || 'Unknown Reporter'}</span>
          </div>
          {incident.reportedBy?.email && (
            <div className="flex items-center gap-2 text-sm text-ink-700">
              <LuMail className="text-ink-500" size={16} />
              <span>{incident.reportedBy.email}</span>
            </div>
          )}
          {incident.reportedBy?.phone && (
            <div className="flex items-center gap-2 text-sm text-ink-700">
              <LuPhone className="text-ink-500" size={16} />
              <span>{incident.reportedBy.phone}</span>
            </div>
          )}
        </div>
        <div className="text-xs text-ink-500 pt-4 border-t border-ink-100 flex flex-col gap-1">
          <span>Reported: {formatDate(incident.createdAt)}</span>
          {incident.updatedAt !== incident.createdAt && (
            <span>Last Updated: {formatDate(incident.updatedAt)}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex gap-3 pt-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default IncidentDetailView;

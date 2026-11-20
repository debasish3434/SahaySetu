import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LuLocateFixed } from 'react-icons/lu';
import Spinner from '../common/Spinner.jsx';

// Fix default Leaflet marker icons not resolving correctly under bundlers like Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Recenters the map whenever coords change (e.g. after auto-locate)
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom() < 13 ? 14 : map.getZoom());
  }, [lat, lng, map]);
  return null;
};

// Lets the user fine-tune the location by clicking anywhere on the map
const ClickToSetLocation = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/**
 * Interactive Leaflet map for selecting/confirming an incident's GPS location.
 * Defaults to a New Delhi view until coordinates are supplied via browser geolocation.
 */
const LocationPicker = ({ latitude, longitude, onChange, onAutoLocate, locating, locateError }) => {
  const defaultCenter = [28.6139, 77.209]; // New Delhi fallback
  const hasCoords = latitude != null && longitude != null;
  const center = hasCoords ? [latitude, longitude] : defaultCenter;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="form-label !mb-0">Incident Location</label>
        <button
          type="button"
          onClick={onAutoLocate}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100/70 disabled:opacity-60"
        >
          {locating ? <Spinner size={13} /> : <LuLocateFixed size={14} />}
          {locating ? 'Locating…' : 'Use my current location'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-300">
        <MapContainer center={center} zoom={hasCoords ? 14 : 5} style={{ height: '280px', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasCoords && <Marker position={[latitude, longitude]} />}
          <RecenterMap lat={latitude} lng={longitude} />
          <ClickToSetLocation onSelect={onChange} />
        </MapContainer>
      </div>

      <p className="mt-2 text-xs text-ink-500">
        {hasCoords
          ? `Selected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} — tap the map to fine-tune.`
          : 'Tap "Use my current location" or click anywhere on the map to set the incident location.'}
      </p>
      {locateError && <p className="form-error">{locateError}</p>}
    </div>
  );
};

export default LocationPicker;

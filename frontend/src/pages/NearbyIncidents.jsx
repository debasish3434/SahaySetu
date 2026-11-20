import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { LuMapPin, LuRotateCcw, LuCompass } from 'react-icons/lu';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { getNearbyIncidentsApi } from '../api/incidentApi.js';
import IncidentCard from '../components/incident/IncidentCard.jsx';
import PageLoader from '../components/common/PageLoader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';
import { CATEGORY_LABELS } from '../utils/constants.js';

// Leaflet marker icon fix for Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const NearbyIncidents = () => {
  const { coords, loading: locating, error: locateError, locate } = useGeolocation();
  const [incidents, setIncidents] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [radius, setRadius] = useState(5000); // meters

  const fetchNearby = useCallback(async (lat, lng, r) => {
    setFetching(true);
    try {
      const { data } = await getNearbyIncidentsApi(lat, lng, r);
      setIncidents(data.incidents || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch nearby incidents');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  useEffect(() => {
    if (coords?.latitude && coords?.longitude) {
      fetchNearby(coords.latitude, coords.longitude, radius);
    }
  }, [coords, radius, fetchNearby]);

  if (locating) {
    return <PageLoader label="Obtaining your location…" />;
  }

  if (locateError && !coords) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <EmptyState
          icon={LuCompass}
          title="Location Access Required"
          description={locateError}
        />
        <div className="mt-4 flex justify-center">
          <Button onClick={locate} className="!w-auto">
            <LuRotateCcw size={16} /> Retry Geolocation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Nearby Incidents</h1>
          <p className="mt-1 text-sm text-ink-500">
            View reported disasters and emergencies within your immediate area.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-ink-600">Search Radius:</label>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={25000}>25 km</option>
            <option value={50000}>50 km</option>
          </select>
        </div>
      </div>

      {coords && (
        <div className="overflow-hidden rounded-xl border border-ink-300 shadow-sm">
          <MapContainer
            center={[coords.latitude, coords.longitude]}
            zoom={13}
            style={{ height: '360px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User current position marker */}
            <Marker position={[coords.latitude, coords.longitude]}>
              <Popup>
                <div className="font-semibold text-brand-600">Your Current Location</div>
              </Popup>
            </Marker>

            {/* Nearby incident markers */}
            {incidents.map((incident) => {
              const [lng, lat] = incident.location?.coordinates || [];
              if (!lat || !lng) return null;
              return (
                <Marker key={incident._id} position={[lat, lng]}>
                  <Popup>
                    <div className="max-w-xs space-y-1">
                      <p className="font-bold text-ink-900">{incident.title}</p>
                      <p className="text-xs text-brand-600 font-medium uppercase">
                        {CATEGORY_LABELS[incident.category] || incident.category}
                      </p>
                      <p className="text-xs text-ink-600 line-clamp-2">{incident.address}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {fetching ? (
        <PageLoader label="Searching for nearby incidents…" />
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={LuMapPin}
          title="No Incidents Nearby"
          description={`No reported disasters were found within a ${radius / 1000} km radius of your location.`}
        />
      ) : (
        <div>
          <h2 className="mb-4 font-display text-lg font-bold text-ink-900">
            Incidents Found ({incidents.length})
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {incidents.map((incident) => (
              <IncidentCard
                key={incident._id}
                incident={incident}
                linkTo={`/incidents/${incident._id}`}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NearbyIncidents;

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { LuHouse, LuMapPin, LuRotateCcw, LuCompass, LuPhone } from 'react-icons/lu';
import { getNearbySheltersApi } from '../api/shelterApi.js';
import PageLoader from '../components/common/PageLoader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';
import { getCurrentLocation } from '../utils/getCurrentLocation.js';

// Fix Leaflet icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_STYLES = {
  open: 'bg-success-100 text-success-700 border border-success-200',
  full: 'bg-danger-100 text-danger-700 border border-danger-200',
  closed: 'bg-surface-100 text-ink-500 border border-surface-200',
};

const calcDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

const NearbyShelters = () => {
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const [shelters, setShelters] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [radius, setRadius] = useState(10000);

  const locate = useCallback(async () => {
    setLocating(true);
    setLocateError('');
    try {
      const position = await getCurrentLocation();
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch (error) {
      setLocateError(error.message);
    } finally {
      setLocating(false);
    }
  }, []);

  const fetchNearby = useCallback(async (lat, lng, r) => {
    setFetching(true);
    try {
      const { data } = await getNearbySheltersApi(lat, lng, r);
      setShelters(data.shelters || []);
    } catch {
      toast.error('Failed to fetch nearby shelters');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { locate(); }, [locate]);

  useEffect(() => {
    if (coords?.latitude && coords?.longitude) {
      fetchNearby(coords.latitude, coords.longitude, radius);
    }
  }, [coords, radius, fetchNearby]);

  if (locating) return <PageLoader label="Getting your location..." />;

  if (locateError && !coords) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <EmptyState icon={LuCompass} title="Location Access Required" description={locateError} />
        <div className="mt-4 flex justify-center">
          <Button onClick={locate} className="!w-auto"><LuRotateCcw size={16} /> Retry Geolocation</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Nearby Shelters</h1>
          <p className="text-ink-500 text-sm">SS-49 — Find emergency shelters near your location</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-ink-600">Search Radius:</label>
          <select value={radius} onChange={e => setRadius(Number(e.target.value))}
            className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 focus:border-brand-500 focus:outline-none">
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={25000}>25 km</option>
            <option value={50000}>50 km</option>
          </select>
        </div>
      </div>

      {/* Map */}
      {coords && (
        <div className="overflow-hidden rounded-xl border border-surface-200 shadow-sm">
          <MapContainer center={[coords.latitude, coords.longitude]} zoom={13} style={{ height: '380px', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[coords.latitude, coords.longitude]}>
              <Popup><div className="font-semibold text-brand-600">📍 Your Location</div></Popup>
            </Marker>
            {shelters.map(shelter => {
              const [lng, lat] = shelter.location?.coordinates || [];
              if (!lat || !lng) return null;
              const available = shelter.totalCapacity - shelter.occupiedCapacity;
              return (
                <Marker key={shelter._id} position={[lat, lng]}>
                  <Popup>
                    <div className="space-y-1 max-w-xs">
                      <p className="font-bold text-ink-900">{shelter.name}</p>
                      <p className="text-xs text-ink-500">{shelter.address}</p>
                      <p className="text-xs"><span className="font-medium">Available:</span> {available} / {shelter.totalCapacity}</p>
                      <p className="text-xs"><span className="font-medium">Status:</span> {shelter.status}</p>
                      {shelter.contactPhone && <p className="text-xs"><span className="font-medium">Phone:</span> {shelter.contactPhone}</p>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {/* Results */}
      {fetching ? (
        <PageLoader label="Searching for nearby shelters..." />
      ) : shelters.length === 0 ? (
        <EmptyState icon={LuHouse} title="No Shelters Nearby" description={`No shelters found within ${radius / 1000} km of your location.`} />
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-ink-900 mb-4">
            {shelters.length} Shelter{shelters.length !== 1 ? 's' : ''} Found
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shelters.map(shelter => {
              const [lng, lat] = shelter.location?.coordinates || [];
              const distance = lat && lng && coords
                ? calcDistance(coords.latitude, coords.longitude, lat, lng)
                : null;
              const available = shelter.totalCapacity - shelter.occupiedCapacity;
              return (
                <div key={shelter._id} className="card p-5 hover:shadow-md transition-shadow space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-brand-50 text-brand-600 rounded-lg"><LuHouse size={16} /></div>
                      <div>
                        <h3 className="font-semibold text-ink-900 text-sm">{shelter.name}</h3>
                        {distance && (
                          <p className="text-xs text-brand-600 font-medium flex items-center gap-0.5">
                            <LuMapPin size={10} /> {distance} km away
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[shelter.status] || ''}`}>
                      {shelter.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 line-clamp-2">{shelter.address}</p>
                  <div>
                    <div className="flex justify-between text-xs text-ink-500 mb-1">
                      <span>Occupancy</span>
                      <span>{shelter.occupiedCapacity}/{shelter.totalCapacity}</span>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${shelter.status === 'full' ? 'bg-danger-500' : available < shelter.totalCapacity * 0.25 ? 'bg-warning-500' : 'bg-success-500'}`}
                        style={{ width: `${shelter.totalCapacity > 0 ? Math.min(100, Math.round((shelter.occupiedCapacity / shelter.totalCapacity) * 100)) : 0}%` }}
                      />
                    </div>
                    <p className={`text-xs font-semibold mt-1 ${available > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {available} spaces available
                    </p>
                  </div>
                  {shelter.contactPhone && (
                    <a href={`tel:${shelter.contactPhone}`} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
                      <LuPhone size={11} /> {shelter.contactPhone}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NearbyShelters;

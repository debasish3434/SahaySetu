import { useState, useCallback } from 'react';
import { getCurrentLocation } from '../utils/getCurrentLocation.js';

/**
 * Wraps the browser Geolocation API in a simple hook with loading/error state.
 * Used by the Incident Report form to auto-capture GPS coordinates.
 */
export const useGeolocation = () => {
  const [coords, setCoords] = useState(null); // { latitude, longitude, accuracy }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const locate = useCallback(() => {
    setLoading(true);
    setError('');
    getCurrentLocation()
      .then(position => setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { coords, loading, error, locate, setCoords };
};

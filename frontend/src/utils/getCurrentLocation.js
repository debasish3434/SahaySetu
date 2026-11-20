import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

const getLocationError = (error) => {
  if (error?.code === 1 || error?.name === 'NotAllowedError') {
    return new Error('Location permission was denied. Allow location access in your device or browser settings, then try again.');
  }
  if (error?.code === 2 || /location services are not enabled/i.test(error?.message || '')) {
    return new Error('Turn on device location services, then try again.');
  }
  if (error?.code === 3 || error?.name === 'TimeoutError') {
    return new Error('Getting your location timed out. Move somewhere with a clearer GPS signal and try again.');
  }
  return new Error(error?.message || 'Could not get your current location. Try again or enter coordinates manually.');
};

export async function getCurrentLocation() {
  try {
    if (Capacitor.isNativePlatform()) {
      let permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        permission = await Geolocation.requestPermissions({ permissions: ['location'] });
      }
      if (permission.location !== 'granted') {
        throw Object.assign(new Error('Location permission was denied.'), { code: 1 });
      }
      return await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 });
    }

    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      throw new Error('Location is blocked because this page uses HTTP on a network address. On this computer, open http://localhost:5173. On another device, use HTTPS or the SahaySetu Android app.');
    }
    if (!navigator.geolocation) throw new Error('Location is not supported by this browser.');

    return await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000,
      });
    });
  } catch (error) {
    throw getLocationError(error);
  }
}

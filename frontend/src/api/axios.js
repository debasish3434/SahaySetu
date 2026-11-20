import axios from 'axios';

// Determine backend API URL dynamically for Web vs Mobile App (APK / PWA)

const getApiBaseUrl = () => {
  // Android APK: use the local backend through ADB reverse
  if (window.Capacitor?.isNativePlatform?.()) {
    return 'http://127.0.0.1:5000/api';
  }

  // Browser accessed through a phone or computer IP address
  const hostname = window.location.hostname;

  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:5000/api`;
  }

  // Local web development
  const envUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL;

  return envUrl || '/api';
};


const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT (if present) to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sahaySetuToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Globally handle expired/invalid tokens by logging the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sahaySetuToken');
      localStorage.removeItem('sahaySetuUser');
      // Avoid redirect loop if already on an auth page
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      if (!publicPaths.some((p) => window.location.pathname.startsWith(p))) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

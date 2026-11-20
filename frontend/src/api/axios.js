import axios from 'axios';

// Determine backend API URL dynamically for Web vs Mobile App (APK / PWA)

const getApiBaseUrl = () => {
  // Android APK: use the local backend through ADB reverse
  if (window.Capacitor?.isNativePlatform?.()) {
    return 'http://127.0.0.1:5000/api';
  }

  // A deployed HTTPS frontend must use its HTTPS API URL to avoid mixed content.
  const configuredApi =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL;
  if (configuredApi) return configuredApi;

  // Browser requests share the frontend origin. Vite proxies /api during
  // development; production can route /api through its HTTPS reverse proxy.
  return '/api';
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

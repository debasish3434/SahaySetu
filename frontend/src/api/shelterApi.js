import api from './axios.js';

// SS-46 – Register Shelter
export const registerShelterApi = (data) => api.post('/shelters', data);

// SS-45 – View Available Shelters
export const getSheltersApi = (params) => api.get('/shelters', { params });

// SS-49 – Search Nearby Shelters
export const getNearbySheltersApi = (lat, lng, radius = 10000) =>
  api.get('/shelters/nearby', { params: { lat, lng, radius } });

// Get shelter by ID
export const getShelterByIdApi = (id) => api.get(`/shelters/${id}`);

// SS-48 – Update Shelter Capacity
export const updateShelterCapacityApi = (id, data) => api.put(`/shelters/${id}/capacity`, data);

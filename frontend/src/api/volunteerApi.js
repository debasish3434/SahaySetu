import api from './axios.js';

export const applyAsVolunteerApi = (data) => api.post('/volunteers/apply', data);
export const getPendingVolunteersApi = () => api.get('/volunteers/pending');
export const verifyVolunteerApi = (userId, decision) =>
  api.patch(`/volunteers/${userId}/verify`, { decision });
export const getVerifiedVolunteersApi = () => api.get('/volunteers/verified');
export const getAllVolunteersApi = (params) => api.get('/volunteers/all', { params });

// SS-37 – View Volunteer History
export const getVolunteerHistoryApi = () => api.get('/volunteers/history');

import api from './axios.js';

export const createIncidentApi = (formData) =>
  api.post('/incidents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getIncidentsApi = (params) => api.get('/incidents', { params });
export const getNearbyIncidentsApi = (lat, lng, radius = 5000) =>
  api.get('/incidents/nearby', { params: { lat, lng, radius } });
export const getIncidentStatsApi = (params) => api.get('/incidents/stats', { params });
export const getIncidentByIdApi = (id) => api.get(`/incidents/${id}`);
export const updateIncidentStatusApi = (id, status) => api.patch(`/incidents/${id}/status`, { status });
export const assignVolunteerApi = (id, volunteerId) => api.patch(`/incidents/${id}/assign`, { volunteerId });
export const acceptTaskApi = (id) => api.patch(`/incidents/${id}/accept-task`);
export const updateTaskStatusApi = (id, taskStatus) => api.patch(`/incidents/${id}/task-status`, { taskStatus });
export const getMyTasksApi = () => api.get('/incidents/my-tasks');

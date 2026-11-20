import api from './axios.js';

export const getIncidentStatsApi = () => api.get('/analytics/incidents');
export const getVolunteerStatsApi = () => api.get('/analytics/volunteers');
export const getResourceStatsApi2 = () => api.get('/analytics/resources');
export const getSystemOverviewApi = () => api.get('/analytics/overview');

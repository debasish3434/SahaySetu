import api from './axios.js';

// SS-47 – Add Relief Resource
export const addResourceApi = (data) => api.post('/resources', data);

// SS-47 – View Resources
export const getResourcesApi = (params) => api.get('/resources', { params });

// SS-47 – Update Resource quantity/status
export const updateResourceApi = (id, data) => api.put(`/resources/${id}`, data);

// Delete resource (admin/coordinator)
export const deleteResourceApi = (id) => api.delete(`/resources/${id}`);

// Resource stats for dashboard
export const getResourceStatsApi = () => api.get('/resources/stats');

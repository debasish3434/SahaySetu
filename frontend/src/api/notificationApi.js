import api from './axios.js';

export const getNotificationsApi = (params = {}) => api.get('/notifications', { params });
export const markAsReadApi = (id) => api.patch(`/notifications/${id}/read`);
export const markAllAsReadApi = () => api.patch('/notifications/read-all');
export const deleteNotificationApi = (id) => api.delete(`/notifications/${id}`);
export const createAnnouncementApi = (data) => api.post('/notifications/announcement', data);
export const getSettingsApi = () => api.get('/settings');
export const updateSettingsApi = (data) => api.put('/settings', data);

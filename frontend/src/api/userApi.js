import api from './axios.js';

export const getProfileApi = () => api.get('/users/profile');
export const updateProfileApi = (data) => api.put('/users/profile', data);
export const updateSettingsApi = (data) => api.put('/users/settings', data);
export const uploadProfilePhotoApi = (formData) =>
  api.put('/users/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

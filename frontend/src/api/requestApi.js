import api from './axios.js';

// SS-38 – Create Emergency Request
export const createEmergencyRequestApi = (data) => api.post('/requests', data);

// SS-39 – View Emergency Requests (my own)
export const getMyRequestsApi = () => api.get('/requests/my-requests');

// SS-39 – View All Emergency Requests (coordinator/admin)
export const getAllRequestsApi = (params) => api.get('/requests', { params });

// Get a single request by ID
export const getRequestByIdApi = (id) => api.get(`/requests/${id}`);

// SS-41 – Prioritize Requests
export const updateRequestPriorityApi = (id, priority) =>
  api.patch(`/requests/${id}/priority`, { priority });

// SS-42 – Assign Volunteer to Request
export const assignVolunteerToRequestApi = (id, volunteerId) =>
  api.patch(`/requests/${id}/assign`, { volunteerId });

// SS-43 – Track / Update Request Status
export const updateRequestStatusApi = (id, status) =>
  api.patch(`/requests/${id}/status`, { status });

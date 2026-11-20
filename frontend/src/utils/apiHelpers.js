/** Helpers to unwrap backend API responses (axios puts payload in res.data). */

export const unwrapIncidentsList = (res) => ({
  incidents: res.data?.incidents || [],
  totalPages: res.data?.pages || 1,
  total: res.data?.total || 0,
});

export const unwrapIncident = (res) => res.data?.incident || null;

export const unwrapUsersList = (res) => ({
  users: res.data?.users || [],
  totalPages: res.data?.pages || 1,
  total: res.data?.total || 0,
});

export const unwrapUser = (res) => res.data?.user || null;

export const unwrapStats = (res) => res.data?.stats || null;

export const getIncidentPhotoUrls = (incident) =>
  (incident?.photos || []).map((photo) => (typeof photo === 'string' ? photo : photo?.url)).filter(Boolean);

export const getReporterName = (incident) =>
  incident?.reportedBy?.name || incident?.reporter?.name || 'Anonymous';

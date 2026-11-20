export const INCIDENT_CATEGORIES = [
  { value: 'flood', label: 'Flood' },
  { value: 'fire', label: 'Fire' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'cyclone', label: 'Cyclone' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'medical', label: 'Medical Emergency' },
  { value: 'accident', label: 'Accident' },
  { value: 'building-collapse', label: 'Building Collapse' },
  { value: 'other', label: 'Other' },
];

export const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const SEVERITY_TONE = {
  low: 'neutral',
  medium: 'warning',
  high: 'accent',
  critical: 'danger',
};

export const STATUS_TONE = {
  reported: 'warning',
  verified: 'brand',
  'in-progress': 'accent',
  resolved: 'success',
  rejected: 'danger',
};

export const STATUS_LABELS = {
  reported: 'Reported',
  verified: 'Verified',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const SEVERITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const ROLE_LABELS = {
  citizen: 'Citizen',
  volunteer: 'Volunteer',
  coordinator: 'Coordinator',
  admin: 'Administrator',
};

export const CATEGORY_LABELS = Object.fromEntries(INCIDENT_CATEGORIES.map(c => [c.value, c.label]));

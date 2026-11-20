import Badge from './Badge.jsx';
import { STATUS_TONE, STATUS_LABELS, SEVERITY_TONE, SEVERITY_LABELS } from '../../utils/constants.js';

export const StatusBadge = ({ status }) => (
  <Badge tone={STATUS_TONE[status] || 'neutral'}>
    {STATUS_LABELS[status] || status}
  </Badge>
);

export const SeverityBadge = ({ severity }) => (
  <Badge tone={SEVERITY_TONE[severity] || 'neutral'}>
    {SEVERITY_LABELS[severity] || severity}
  </Badge>
);

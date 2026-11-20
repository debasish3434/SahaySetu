import { Link } from 'react-router-dom';

const TONES = {
  navy: 'bg-brand-50 text-brand-700 ring-brand-100',
  blue: 'bg-accent-50 text-accent-700 ring-accent-100',
  green: 'bg-success-50 text-success-600 ring-success-100',
  amber: 'bg-warning-50 text-warning-700 ring-warning-100',
  red: 'bg-danger-50 text-danger-600 ring-danger-100',
  slate: 'bg-surface-100 text-ink-600 ring-surface-200',
};

export default function MetricCard({ icon: Icon, label, value, detail, to, tone = 'navy', className = '' }) {
  const content = <><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${TONES[tone] || TONES.navy}`}><Icon size={19} strokeWidth={1.9} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-ink-500">{label}</span><strong className="mt-1 block text-2xl font-semibold leading-none tracking-tight text-ink-900">{value ?? '—'}</strong>{detail && <span className="mt-1 block truncate text-xs text-ink-400">{detail}</span>}</span></>;
  const classes = `flex min-h-[92px] items-center gap-3 rounded-2xl border border-surface-200 bg-white p-4 shadow-card transition-all ${to ? 'hover:-translate-y-0.5 hover:border-accent-200 hover:shadow-card-hover' : ''} ${className}`;
  return to ? <Link to={to} className={classes}>{content}</Link> : <div className={classes}>{content}</div>;
}

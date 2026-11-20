import { motion } from 'framer-motion';

export default function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <motion.header initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className={`flex flex-col justify-between gap-4 sm:flex-row sm:items-end ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.13em] text-accent-700">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm leading-6 text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  );
}

const PageLoader = ({ label = 'Loading SahaySetu…' }) => (
  <section aria-label={label} role="status" className="page-enter min-h-[55vh] w-full space-y-6 py-2">
    <span className="sr-only">{label}</span>
    <div className="flex items-center gap-3"><span className="h-10 w-10 animate-pulse rounded-xl bg-brand-100" /><span className="space-y-2"><span className="block h-4 w-44 animate-pulse rounded bg-surface-200" /><span className="block h-3 w-64 max-w-[70vw] animate-pulse rounded bg-surface-100" /></span></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map(item => <div key={item} className="h-24 animate-pulse rounded-2xl border border-surface-100 bg-white p-4"><div className="h-3 w-20 rounded bg-surface-100" /><div className="mt-4 h-6 w-12 rounded bg-surface-200" /></div>)}</div>
    <div className="h-64 animate-pulse rounded-2xl border border-surface-100 bg-white p-5"><div className="h-4 w-36 rounded bg-surface-100" /><div className="mt-6 h-36 rounded-xl bg-surface-50" /></div>
  </section>
);

export default PageLoader;

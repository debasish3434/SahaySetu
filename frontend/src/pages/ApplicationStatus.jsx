import { useLocation, Link } from 'react-router-dom';

export default function ApplicationStatus() {
  const location = useLocation();
  const status = location.state?.status || new URLSearchParams(location.search).get('status') || 'pending';
  const rejected = status === 'rejected';
  const deactivated = status === 'deactivated';
  const title = deactivated ? 'Account Deactivated' : rejected ? 'Application Rejected' : 'Pending Approval';
  const message = deactivated
    ? 'Your account is currently inactive. Please contact the administrator.'
    : rejected
      ? 'Your application has been rejected. Please contact the administrator for further information.'
      : 'Your application has been submitted successfully. Please wait for administrator approval.';
  return <main className="flex min-h-screen items-center justify-center bg-surface p-5"><section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl"><div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-3xl">{deactivated || rejected ? '!' : '…'}</div><h1 className="text-2xl font-bold">{title}</h1><p className="mt-3 text-ink-600">{message}</p><Link to="/login" className="mt-6 inline-block rounded-xl bg-accent-600 px-5 py-3 font-semibold text-white">Go to login</Link></section></main>;
}

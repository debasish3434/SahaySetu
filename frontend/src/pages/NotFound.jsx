import { Link } from 'react-router-dom';
import { LuCompass } from 'react-icons/lu';
import Button from '../components/common/Button.jsx';

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
      <LuCompass size={30} />
    </div>
    <h1 className="font-display text-3xl font-bold text-ink-900">Page not found</h1>
    <p className="mt-2 max-w-sm text-sm text-ink-500">
      The page you&apos;re looking for doesn&apos;t exist or may have been moved.
    </p>
    <Link to="/dashboard" className="mt-6">
      <Button className="!w-auto">Back to Dashboard</Button>
    </Link>
  </div>
);

export default NotFound;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuHouse, LuSearch, LuPhone, LuFilter } from 'react-icons/lu';
import { getSheltersApi } from '../api/shelterApi.js';
import PageLoader from '../components/common/PageLoader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useAuth } from '../hooks/useAuth.js';

const STATUS_STYLES = {
  open: 'bg-success-100 text-success-700 border border-success-200',
  full: 'bg-danger-100 text-danger-700 border border-danger-200',
  closed: 'bg-surface-100 text-ink-500 border border-surface-200',
};

const ShelterList = () => {
  const { user } = useAuth();
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getSheltersApi();
        setShelters(data.shelters || []);
      } catch {
        toast.error('Failed to load shelters');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = shelters.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.address?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isCoordOrAdmin = ['coordinator', 'admin'].includes(user?.role);

  if (loading) return <PageLoader label="Loading shelters..." />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Available Shelters</h1>
          <p className="text-ink-500 text-sm">SS-45 — View all registered emergency shelters</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/shelters/nearby" className="inline-flex items-center gap-2 px-4 py-2 border border-brand-500 text-brand-600 rounded-md hover:bg-brand-50 transition-colors text-sm font-medium">
            <LuSearch size={14} /> Nearby Shelters
          </Link>
          {isCoordOrAdmin && (
            <Link to="/shelters/register" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors text-sm font-medium">
              <LuHouse size={14} /> Register Shelter
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <LuSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or address..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-surface-200 text-sm text-ink-800 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <LuFilter size={14} className="text-ink-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="full">Full</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <p className="text-xs text-ink-500 self-center">{filtered.length} shelter(s) found</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={LuHouse} title="No Shelters Found" description={search || statusFilter ? "No shelters match your search." : "No shelters have been registered yet."} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(shelter => {
            const available = shelter.totalCapacity - shelter.occupiedCapacity;
            const occupancyPct = shelter.totalCapacity > 0 ? Math.round((shelter.occupiedCapacity / shelter.totalCapacity) * 100) : 0;
            return (
              <div key={shelter._id} className="card p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-lg"><LuHouse size={18} /></div>
                    <div>
                      <h3 className="font-semibold text-ink-900 text-sm leading-tight">{shelter.name}</h3>
                      <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{shelter.address}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[shelter.status] || 'bg-surface-100 text-ink-600'}`}>
                    {shelter.status}
                  </span>
                </div>

                {/* Capacity bar */}
                <div>
                  <div className="flex justify-between text-xs text-ink-500 mb-1">
                    <span>Capacity</span>
                    <span>{shelter.occupiedCapacity}/{shelter.totalCapacity}</span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${occupancyPct >= 100 ? 'bg-danger-500' : occupancyPct >= 75 ? 'bg-warning-500' : 'bg-success-500'}`}
                      style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-ink-500">Occupied: {shelter.occupiedCapacity}</span>
                    <span className={`text-xs font-semibold ${available > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      Available: {available}
                    </span>
                  </div>
                </div>

                {/* Facilities */}
                {shelter.facilities?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {shelter.facilities.slice(0, 4).map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-surface-100 text-ink-600 text-xs rounded">{f}</span>
                    ))}
                    {shelter.facilities.length > 4 && (
                      <span className="text-xs text-ink-400">+{shelter.facilities.length - 4} more</span>
                    )}
                  </div>
                )}

                {/* Contact */}
                {shelter.contactPhone && (
                  <a href={`tel:${shelter.contactPhone}`} className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700">
                    <LuPhone size={11} /> {shelter.contactPhone}
                  </a>
                )}

                {isCoordOrAdmin && (
                  <Link to="/shelters/manage" className="mt-auto pt-2 border-t border-surface-200 text-xs text-center text-brand-600 hover:text-brand-700 font-medium">
                    Update Capacity →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ShelterList;

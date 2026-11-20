import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuHouse, LuX, LuLoader, LuCirclePlus } from 'react-icons/lu';
import { getSheltersApi, updateShelterCapacityApi } from '../../api/shelterApi.js';
import PageLoader from '../../components/common/PageLoader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

const STATUS_STYLES = {
  open: 'bg-success-100 text-success-700',
  full: 'bg-danger-100 text-danger-700',
  closed: 'bg-surface-100 text-ink-500',
};

const ManageShelters = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editShelter, setEditShelter] = useState(null);
  const [formTotal, setFormTotal] = useState('');
  const [formOccupied, setFormOccupied] = useState('');
  const [formStatus, setFormStatus] = useState('open');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchShelters = async () => {
    setLoading(true);
    try {
      const { data } = await getSheltersApi();
      setShelters(data.shelters || []);
    } catch {
      toast.error('Failed to load shelters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShelters(); }, []);

  const openEdit = (shelter) => {
    setEditShelter(shelter);
    setFormTotal(shelter.totalCapacity.toString());
    setFormOccupied(shelter.occupiedCapacity.toString());
    setFormStatus(shelter.status);
    setError('');
  };

  const closeEdit = () => { setEditShelter(null); setError(''); };

  const handleSave = async () => {
    const total = parseInt(formTotal, 10);
    const occupied = parseInt(formOccupied, 10);
    if (isNaN(total) || total < 0) { setError('Total capacity must be a non-negative number'); return; }
    if (isNaN(occupied) || occupied < 0) { setError('Occupied capacity must be a non-negative number'); return; }
    if (occupied > total) { setError('Occupied capacity cannot exceed total capacity'); return; }
    setSaving(true);
    try {
      await updateShelterCapacityApi(editShelter._id, { totalCapacity: total, occupiedCapacity: occupied, status: formStatus });
      toast.success('Shelter capacity updated successfully!');
      closeEdit();
      fetchShelters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update shelter');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Manage Shelters</h1>
          <p className="text-ink-500 text-sm">SS-48 — Update shelter capacity and status</p>
        </div>
        <Link to="/shelters/register"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors text-sm font-medium">
          <LuCirclePlus size={14} /> Register New Shelter
        </Link>
      </div>

      <div className="card overflow-hidden">
        {loading ? <PageLoader /> : shelters.length === 0 ? (
          <EmptyState icon={LuHouse} title="No Shelters Registered" description="Register a shelter to start managing capacity." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 text-ink-500 text-xs uppercase border-b border-surface-200">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium text-center">Total</th>
                  <th className="px-4 py-3 font-medium text-center">Occupied</th>
                  <th className="px-4 py-3 font-medium text-center">Available</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {shelters.map(shelter => {
                  const available = shelter.totalCapacity - shelter.occupiedCapacity;
                  return (
                    <tr key={shelter._id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink-900 text-sm">{shelter.name}</td>
                      <td className="px-4 py-3 text-sm text-ink-600 max-w-[200px] truncate">{shelter.address}</td>
                      <td className="px-4 py-3 text-center text-sm text-ink-700 font-medium">{shelter.totalCapacity}</td>
                      <td className="px-4 py-3 text-center text-sm text-ink-700">{shelter.occupiedCapacity}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${available > 0 ? 'text-success-600' : 'text-danger-600'}`}>{available}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[shelter.status] || ''}`}>
                          {shelter.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openEdit(shelter)}
                          className="px-3 py-1 text-xs font-medium text-brand-600 border border-brand-200 rounded-md hover:bg-brand-50 transition-colors">
                          Update Capacity
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editShelter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeEdit}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-surface-200">
              <h2 className="text-lg font-bold text-ink-900">Update Capacity – {editShelter.name}</h2>
              <button onClick={closeEdit} className="text-ink-400 hover:text-ink-600"><LuX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Total Capacity</label>
                <input type="number" min="0" value={formTotal} onChange={e => { setFormTotal(e.target.value); setError(''); }}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Occupied Capacity</label>
                <input type="number" min="0" value={formOccupied} onChange={e => { setFormOccupied(e.target.value); setError(''); }}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Status</label>
                <select value={formStatus} onChange={e => setFormStatus(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none">
                  <option value="open">Open</option>
                  <option value="full">Full</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {/* Live available calc */}
              {formTotal && formOccupied && (
                <div className={`text-sm font-medium rounded-lg p-2 text-center ${parseInt(formOccupied) > parseInt(formTotal) ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700'}`}>
                  Available: {Math.max(0, parseInt(formTotal || 0) - parseInt(formOccupied || 0))} spaces
                </div>
              )}
              {error && <p className="text-xs text-danger-600">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={closeEdit} className="flex-1 py-2 border border-surface-200 text-ink-600 rounded-lg text-sm hover:bg-surface-50 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <LuLoader size={14} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ManageShelters;

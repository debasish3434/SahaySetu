import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LuPackage, LuPlus, LuPencil, LuTrash2, LuX, LuLoader } from 'react-icons/lu';
import { getResourcesApi, addResourceApi, updateResourceApi, deleteResourceApi } from '../../api/resourceApi.js';
import PageLoader from '../../components/common/PageLoader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatDate } from '../../utils/formatters.js';

const CATEGORY_OPTIONS = [
  { value: 'food', label: 'Food Supplies' },
  { value: 'water', label: 'Water' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'emergency_kit', label: 'Emergency Kit' },
  { value: 'shelter_kit', label: 'Shelter Kit' },
  { value: 'other', label: 'Other' },
];

const STATUS_STYLES = {
  available: 'bg-success-100 text-success-700 border border-success-200',
  low: 'bg-warning-100 text-warning-700 border border-warning-200',
  depleted: 'bg-danger-100 text-danger-700 border border-danger-200',
};

const EMPTY_FORM = { name: '', category: 'food', quantity: '', unit: 'items', location: 'Central Relief Hub' };

const ManageResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0, low: 0, depleted: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getResourcesApi({ category: categoryFilter || undefined, status: statusFilter || undefined });
      const list = data.resources || [];
      setResources(list);
      setStats({
        total: list.length,
        available: list.filter(r => r.status === 'available').length,
        low: list.filter(r => r.status === 'low').length,
        depleted: list.filter(r => r.status === 'depleted').length,
      });
    } catch {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ name: r.name, category: r.category, quantity: r.quantity.toString(), unit: r.unit, location: r.location });
    setEditingId(r._id);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Resource name is required'); return; }
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 0) {
      toast.error('Valid quantity is required'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, quantity: parseInt(form.quantity, 10) };
      if (editingId) {
        await updateResourceApi(editingId, payload);
        toast.success('Resource updated successfully!');
      } else {
        await addResourceApi(payload);
        toast.success('Resource added successfully!');
      }
      closeModal();
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteResourceApi(id);
      toast.success('Resource deleted');
      setConfirmDeleteId(null);
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete resource');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Relief Resources</h1>
          <p className="text-ink-500 text-sm">SS-47 — Manage food, water, medicine and other relief supplies</p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors text-sm font-medium">
          <LuPlus size={16} /> Add Resource
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'border-ink-400', bg: 'bg-surface-100', text: 'text-ink-600' },
          { label: 'Available', value: stats.available, color: 'border-success-500', bg: 'bg-success-50', text: 'text-success-600' },
          { label: 'Low Stock', value: stats.low, color: 'border-warning-500', bg: 'bg-warning-50', text: 'text-warning-600' },
          { label: 'Depleted', value: stats.depleted, color: 'border-danger-500', bg: 'bg-danger-50', text: 'text-danger-600' },
        ].map(s => (
          <div key={s.label} className={`card p-4 flex items-center gap-3 border-l-4 ${s.color}`}>
            <div className={`p-2 ${s.bg} ${s.text} rounded-full`}><LuPackage size={18} /></div>
            <div><p className="text-xs text-ink-500">{s.label}</p><p className="text-xl font-bold text-ink-900">{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-ink-600">Category:</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs text-ink-800 focus:border-brand-500 focus:outline-none">
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-ink-600">Status:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs text-ink-800 focus:border-brand-500 focus:outline-none">
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="low">Low Stock</option>
            <option value="depleted">Depleted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <PageLoader /> : resources.length === 0 ? (
          <EmptyState icon={LuPackage} title="No Resources Found" description="Add relief resources using the button above." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 text-ink-500 text-xs uppercase border-b border-surface-200">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Quantity</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {resources.map(r => (
                  <tr key={r._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-ink-900 text-sm">{r.name}</td>
                    <td className="px-4 py-3 text-sm text-ink-600 capitalize">
                      {CATEGORY_OPTIONS.find(c => c.value === r.category)?.label || r.category}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink-900">{r.quantity}</td>
                    <td className="px-4 py-3 text-sm text-ink-500">{r.unit}</td>
                    <td className="px-4 py-3 text-sm text-ink-600 max-w-[150px] truncate">{r.location}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] || ''}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">{formatDate(r.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(r)}
                          className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-md transition-colors" title="Edit">
                          <LuPencil size={14} />
                        </button>
                        {confirmDeleteId === r._id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(r._id)} disabled={deletingId === r._id}
                              className="px-2 py-1 text-xs bg-danger-600 text-white rounded-md hover:bg-danger-700 disabled:opacity-50">
                              {deletingId === r._id ? '...' : 'Yes'}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs bg-surface-100 text-ink-600 rounded-md hover:bg-surface-200">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(r._id)}
                            className="p-1.5 text-danger-600 hover:bg-danger-50 rounded-md transition-colors" title="Delete">
                            <LuTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-surface-200">
              <h2 className="text-lg font-bold text-ink-900">{editingId ? 'Edit Resource' : 'Add New Resource'}</h2>
              <button onClick={closeModal} className="text-ink-400 hover:text-ink-600"><LuX size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Resource Name *</label>
                <input name="name" value={form.name} onChange={handleChange} type="text" placeholder="e.g. Rice (50kg bags)"
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Category *</label>
                  <select name="category" value={form.category} onChange={handleChange}
                    className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none">
                    {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Quantity *</label>
                  <input name="quantity" value={form.quantity} onChange={handleChange} type="number" min="0" placeholder="0"
                    className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Unit</label>
                  <input name="unit" value={form.unit} onChange={handleChange} type="text" placeholder="items, kg, liters..."
                    className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Storage Location</label>
                  <input name="location" value={form.location} onChange={handleChange} type="text" placeholder="Relief Hub"
                    className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2 border border-surface-200 text-ink-600 rounded-lg text-sm hover:bg-surface-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <LuLoader size={14} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : editingId ? 'Update Resource' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ManageResources;

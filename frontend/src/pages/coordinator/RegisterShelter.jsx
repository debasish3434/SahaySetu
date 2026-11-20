import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuHouse, LuMapPin, LuLoader } from 'react-icons/lu';
import { registerShelterApi } from '../../api/shelterApi.js';
import { getCurrentLocation } from '../../utils/getCurrentLocation.js';

const FACILITIES_OPTIONS = ['Food', 'Water', 'Toilets', 'Medical', 'Bedding', 'Electricity', 'WiFi', 'Disabled Access'];

const RegisterShelter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', latitude: '', longitude: '',
    totalCapacity: '', occupiedCapacity: '0', contactPhone: '', facilitiesText: '',
  });
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const toggleFacility = (f) => {
    setSelectedFacilities(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  const getLocation = async () => {
    setLocating(true);
    try {
      const position = await getCurrentLocation();
      setForm(prev => ({ ...prev, latitude: position.coords.latitude.toFixed(6), longitude: position.coords.longitude.toFixed(6) }));
      toast.success('Location captured');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLocating(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Shelter name is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.latitude || isNaN(Number(form.latitude))) e.latitude = 'Valid latitude required';
    if (!form.longitude || isNaN(Number(form.longitude))) e.longitude = 'Valid longitude required';
    if (!form.totalCapacity || Number(form.totalCapacity) < 1) e.totalCapacity = 'Capacity must be at least 1';
    if (Number(form.occupiedCapacity) > Number(form.totalCapacity)) e.occupiedCapacity = 'Occupied cannot exceed total capacity';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const allFacilities = [
        ...selectedFacilities,
        ...(form.facilitiesText ? form.facilitiesText.split(',').map(f => f.trim()).filter(Boolean) : []),
      ];
      await registerShelterApi({
        name: form.name, address: form.address,
        latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude),
        totalCapacity: parseInt(form.totalCapacity, 10),
        occupiedCapacity: parseInt(form.occupiedCapacity, 10),
        contactPhone: form.contactPhone,
        facilities: allFacilities,
      });
      toast.success('Shelter registered successfully!');
      navigate('/shelters');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register shelter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-50 text-brand-600 rounded-full"><LuHouse size={24} /></div>
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Register Shelter</h1>
          <p className="text-ink-600 text-sm">SS-46 — Add a new emergency shelter to the system</p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Shelter Name *</label>
            <input name="name" value={form.name} onChange={handleChange} type="text"
              placeholder="e.g. Community Hall, School Building" maxLength={100}
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            {errors.name && <p className="mt-1 text-xs text-danger-600">{errors.name}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Full Address *</label>
            <textarea name="address" value={form.address} onChange={handleChange} rows={2}
              placeholder="Enter complete address..."
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none" />
            {errors.address && <p className="mt-1 text-xs text-danger-600">{errors.address}</p>}
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-ink-700">Coordinates *</label>
              <button type="button" onClick={getLocation} disabled={locating}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50">
                {locating ? <LuLoader size={12} className="animate-spin" /> : <LuMapPin size={12} />}
                {locating ? 'Locating...' : 'Use My Location'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input name="latitude" value={form.latitude} onChange={handleChange} type="number" step="any" placeholder="Latitude"
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                {errors.latitude && <p className="mt-1 text-xs text-danger-600">{errors.latitude}</p>}
              </div>
              <div>
                <input name="longitude" value={form.longitude} onChange={handleChange} type="number" step="any" placeholder="Longitude"
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                {errors.longitude && <p className="mt-1 text-xs text-danger-600">{errors.longitude}</p>}
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Total Capacity *</label>
              <input name="totalCapacity" value={form.totalCapacity} onChange={handleChange} type="number" min="1" placeholder="e.g. 200"
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              {errors.totalCapacity && <p className="mt-1 text-xs text-danger-600">{errors.totalCapacity}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Currently Occupied</label>
              <input name="occupiedCapacity" value={form.occupiedCapacity} onChange={handleChange} type="number" min="0" placeholder="0"
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              {errors.occupiedCapacity && <p className="mt-1 text-xs text-danger-600">{errors.occupiedCapacity}</p>}
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Contact Phone</label>
            <input name="contactPhone" value={form.contactPhone} onChange={handleChange} type="tel" placeholder="10-digit phone number"
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>

          {/* Facilities */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">Available Facilities</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {FACILITIES_OPTIONS.map(f => (
                <button key={f} type="button" onClick={() => toggleFacility(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedFacilities.includes(f)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-ink-600 border-surface-200 hover:border-brand-300'
                  }`}>{f}</button>
              ))}
            </div>
            <input name="facilitiesText" value={form.facilitiesText} onChange={handleChange} type="text"
              placeholder="Additional facilities (comma-separated)..."
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
            {loading ? <><LuLoader size={18} className="animate-spin" /> Registering...</> : <><LuHouse size={18} /> Register Shelter</>}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default RegisterShelter;

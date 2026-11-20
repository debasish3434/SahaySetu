import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuCircleAlert, LuMapPin, LuLoader } from 'react-icons/lu';
import { createEmergencyRequestApi } from '../../api/requestApi.js';
import { getCurrentLocation } from '../../utils/getCurrentLocation.js';

const REQUEST_TYPES = [
  { value: 'medical', label: 'Medical Emergency' },
  { value: 'rescue', label: 'Rescue / Evacuation' },
  { value: 'food_water', label: 'Food & Water' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'evacuation', label: 'Evacuation' },
  { value: 'other', label: 'Other' },
];

const EmergencyRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    requestType: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    contactPhone: '',
    peopleCount: 1,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const getLocation = async () => {
    setLocating(true);
    try {
      const position = await getCurrentLocation();
      setForm(prev => ({ ...prev, latitude: position.coords.latitude.toFixed(6), longitude: position.coords.longitude.toFixed(6) }));
      toast.success('Location captured successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLocating(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.requestType) newErrors.requestType = 'Please select a request type';
    if (!form.description || form.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    if (!form.latitude || isNaN(Number(form.latitude))) newErrors.latitude = 'Valid latitude is required';
    if (!form.longitude || isNaN(Number(form.longitude))) newErrors.longitude = 'Valid longitude is required';
    if (form.peopleCount < 1) newErrors.peopleCount = 'At least 1 person required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      await createEmergencyRequestApi({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        peopleCount: parseInt(form.peopleCount, 10),
      });
      toast.success('Emergency request submitted successfully!');
      navigate('/my-requests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit emergency request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-danger-50 text-danger-600 rounded-full"><LuCircleAlert size={24} /></div>
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Create Emergency Request</h1>
          <p className="text-ink-600 text-sm">SS-38 — Submit an emergency request for immediate assistance</p>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Emergency Type *</label>
            <select
              name="requestType"
              value={form.requestType}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Select emergency type</option>
              {REQUEST_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.requestType && <p className="mt-1 text-xs text-danger-600">{errors.requestType}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe your emergency situation in detail..."
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            />
            {errors.description && <p className="mt-1 text-xs text-danger-600">{errors.description}</p>}
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-ink-700">Location *</label>
              <button
                type="button"
                onClick={getLocation}
                disabled={locating}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
              >
                {locating ? <LuLoader size={12} className="animate-spin" /> : <LuMapPin size={12} />}
                {locating ? 'Getting location...' : 'Use My Location'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {errors.latitude && <p className="mt-1 text-xs text-danger-600">{errors.latitude}</p>}
              </div>
              <div>
                <input
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {errors.longitude && <p className="mt-1 text-xs text-danger-600">{errors.longitude}</p>}
              </div>
            </div>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              type="text"
              placeholder="Full address (optional)"
              className="mt-2 w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Contact & People */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Contact Phone</label>
              <input
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                type="tel"
                placeholder="10-digit phone number"
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Number of People</label>
              <input
                name="peopleCount"
                value={form.peopleCount}
                onChange={handleChange}
                type="number"
                min="1"
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              {errors.peopleCount && <p className="mt-1 text-xs text-danger-600">{errors.peopleCount}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-danger-600 text-white rounded-lg font-semibold hover:bg-danger-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <><LuLoader size={18} className="animate-spin" /> Submitting...</>
            ) : (
              <><LuCircleAlert size={18} /> Submit Emergency Request</>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default EmergencyRequest;

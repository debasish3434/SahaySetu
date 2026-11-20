import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LuTriangleAlert } from 'react-icons/lu';
import Input from '../components/common/Input.jsx';
import TextArea from '../components/common/TextArea.jsx';
import Select from '../components/common/Select.jsx';
import Button from '../components/common/Button.jsx';
import LocationPicker from '../components/incident/LocationPicker.jsx';
import PhotoUpload from '../components/incident/PhotoUpload.jsx';
import VideoUpload from '../components/incident/VideoUpload.jsx';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { createIncidentApi } from '../api/incidentApi.js';
import { INCIDENT_CATEGORIES, SEVERITY_LEVELS } from '../utils/constants.js';

/**
 * Report Incident page — the core of incident reporting flow.
 * Captures incident details, GPS location (auto or manual), and photo/video evidence,
 * then submits everything as multipart/form-data to the backend.
 */
const ReportIncident = () => {
  const navigate = useNavigate();
  const { coords, loading: locating, error: locateError, locate, setCoords } = useGeolocation();
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { severity: 'medium' } });

  const handleMapSelect = (lat, lng) => setCoords({ latitude: lat, longitude: lng });

  const onSubmit = async (formData) => {
    if (!coords) {
      toast.error('Please set the incident location before submitting');
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== '') payload.append(key, value);
    });
    payload.append('latitude', coords.latitude);
    payload.append('longitude', coords.longitude);
    photos.forEach((file) => payload.append('photos', file));
    videos.forEach((file) => payload.append('videos', file));

    setSubmitting(true);
    try {
      await createIncidentApi(payload);
      toast.success('Incident reported successfully. Thank you for helping!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.errors?.[0]?.message || err.response?.data?.message;
      toast.error(message || 'Failed to submit incident. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-3xl"
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger-100 text-danger-600">
          <LuTriangleAlert size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Report an Incident</h1>
          <p className="mt-1 text-sm text-ink-500">
            Share accurate details so responders can act quickly. Every field helps.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        <Input
          label="Incident title"
          name="title"
          placeholder="e.g. Flash flooding near Sector 12 market"
          error={errors.title}
          {...register('title', {
            required: 'Title is required',
            minLength: { value: 5, message: 'Title must be at least 5 characters' },
            maxLength: { value: 120, message: 'Title cannot exceed 120 characters' },
          })}
        />

        <TextArea
          label="Description"
          name="description"
          rows={5}
          placeholder="Describe what's happening, who's affected, and any immediate risks…"
          error={errors.description}
          {...register('description', {
            required: 'Description is required',
            minLength: { value: 20, message: 'Please provide at least 20 characters' },
            maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' },
          })}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Select
            label="Category"
            name="category"
            placeholder="Select a category"
            options={INCIDENT_CATEGORIES}
            error={errors.category}
            {...register('category', { required: 'Please select a category' })}
          />
          <Select
            label="Severity"
            name="severity"
            options={SEVERITY_LEVELS}
            error={errors.severity}
            {...register('severity')}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Contact phone (optional)"
            name="contactPhone"
            placeholder="9876543210"
            error={errors.contactPhone}
            {...register('contactPhone', {
              pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian phone number' },
            })}
          />
          <Input
            label="People affected (approx.)"
            name="peopleAffected"
            type="number"
            min="0"
            placeholder="0"
            error={errors.peopleAffected}
            {...register('peopleAffected', { min: { value: 0, message: 'Must be 0 or more' } })}
          />
        </div>

        <Input
          label="Landmark / address (optional)"
          name="address"
          placeholder="Near City Hospital, MG Road"
          {...register('address')}
        />

        <LocationPicker
          latitude={coords?.latitude}
          longitude={coords?.longitude}
          onChange={handleMapSelect}
          onAutoLocate={locate}
          locating={locating}
          locateError={locateError}
        />

        <PhotoUpload files={photos} onChange={setPhotos} />
        <VideoUpload files={videos} onChange={setVideos} />

        <div className="flex flex-col-reverse gap-3 border-t border-ink-100 pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="!w-auto"
            onClick={() => navigate('/dashboard')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={submitting} className="!w-auto">
            Submit Report
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default ReportIncident;

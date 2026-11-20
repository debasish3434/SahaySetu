import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LuHeartHandshake, LuCheck, LuShieldCheck, LuClock, LuCircleX } from 'react-icons/lu';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { applyAsVolunteerApi } from '../api/volunteerApi.js';

const AVAILABILITY_OPTIONS = [
  { value: 'anytime', label: 'Anytime / 24x7' },
  { value: 'weekdays', label: 'Weekdays Only' },
  { value: 'weekends', label: 'Weekends Only' },
  { value: 'on-call', label: 'Emergency On-Call Only' },
];

const VolunteerApply = () => {
  const navigate = useNavigate();
  const { user, updateUserInContext } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      skills: user?.volunteerProfile?.skills?.join(', ') || '',
      availability: user?.volunteerProfile?.availability || 'anytime',
    },
  });

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const { data } = await applyAsVolunteerApi(formData);
      updateUserInContext(data.user);
      toast.success('Volunteer application submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit volunteer application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const isAlreadyVolunteer = user.role === 'volunteer';
  const status = user.volunteerProfile?.verificationStatus || 'unverified';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl"
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <LuHeartHandshake size={24} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            {isAlreadyVolunteer ? 'Volunteer Profile Status' : 'Become a Disaster Volunteer'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Join SahaySetu&apos;s verified response team to receive task assignments during disasters.
          </p>
        </div>
      </div>

      {isAlreadyVolunteer && status !== 'unverified' ? (
        <div className="card space-y-5">
          <div className="flex items-center justify-between border-b border-ink-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Application Status
              </p>
              <div className="mt-1 flex items-center gap-2">
                {status === 'verified' && (
                  <Badge tone="success" className="!text-sm py-1 px-3">
                    <LuShieldCheck className="mr-1" /> Verified Volunteer
                  </Badge>
                )}
                {status === 'pending' && (
                  <Badge tone="warning" className="!text-sm py-1 px-3">
                    <LuClock className="mr-1" /> Verification Pending
                  </Badge>
                )}
                {status === 'rejected' && (
                  <Badge tone="danger" className="!text-sm py-1 px-3">
                    <LuCircleX className="mr-1" /> Application Rejected
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Skills Registered</p>
              <p className="mt-1 text-sm text-ink-900">
                {user.volunteerProfile?.skills?.join(', ') || 'None specified'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Availability</p>
              <p className="mt-1 text-sm text-ink-900 capitalize">
                {user.volunteerProfile?.availability || 'Not specified'}
              </p>
            </div>
          </div>

          {status === 'pending' && (
            <p className="rounded-lg bg-warning-50 p-3.5 text-xs text-warning-800">
              Your application is under review by a disaster coordinator or administrator. You will be assigned response tasks once verified.
            </p>
          )}

          {status === 'rejected' && (
            <p className="rounded-lg bg-danger-50 p-3.5 text-xs text-danger-800">
              Your application was not approved at this time. You may update your profile or contact support for further inquiries.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
          <Input
            label="Skills & Qualifications"
            name="skills"
            placeholder="e.g. First Aid, Search & Rescue, Swimming, Driving, Medical"
            error={errors.skills}
            {...register('skills', {
              required: 'Please list at least one skill or area of expertise',
            })}
          />

          <Select
            label="Availability"
            name="availability"
            options={AVAILABILITY_OPTIONS}
            error={errors.availability}
            {...register('availability', { required: 'Please select your availability' })}
          />

          <div className="rounded-lg bg-brand-50 p-4 text-xs text-brand-800">
            <p className="font-semibold">What happens after applying?</p>
            <p className="mt-1">
              Your application will enter the verification queue. Disaster coordinators will verify your details before assigning critical emergency response tasks to you.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-ink-100 pt-5">
            <Button
              type="button"
              variant="outline"
              className="!w-auto"
              onClick={() => navigate('/dashboard')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="!w-auto">
              <LuCheck size={16} /> Submit Application
            </Button>
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default VolunteerApply;

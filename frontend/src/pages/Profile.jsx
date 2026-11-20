import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LuPencil, LuCheck, LuX } from 'react-icons/lu';
import Input from '../components/common/Input.jsx';
import TextArea from '../components/common/TextArea.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import AvatarUploader from '../components/profile/AvatarUploader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { updateProfileApi } from '../api/userApi.js';
import { ROLE_LABELS } from '../utils/constants.js';
import { formatDate } from '../utils/formatters.js';

/**
 * View & Edit Profile page. Toggles between a read-only view and an editable
 * form powered by react-hook-form, pre-filled with the current user's data.
 */
const Profile = () => {
  const { user, updateUserInContext } = useAuth();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || '',
    },
  });

  const startEditing = () => {
    reset({ name: user.name, phone: user.phone || '', address: user.address || '', bio: user.bio || '' });
    setEditing(true);
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const { data } = await updateProfileApi(formData);
      updateUserInContext(data.user);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-3xl"
    >
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900">My Profile</h1>
        <p className="mt-1 text-sm text-ink-500">View and manage your account information.</p>
      </div>

      <div className="card">
        {/* Header: avatar + name + role */}
        <div className="flex flex-col items-start gap-4 border-b border-ink-100 pb-6 sm:flex-row sm:items-center">
          <AvatarUploader user={user} onUploaded={updateUserInContext} />
          <div className="flex-1">
            <h2 className="font-display text-lg font-semibold text-ink-900">{user.name}</h2>
            <p className="text-sm text-ink-500">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="brand">{ROLE_LABELS[user.role] || user.role}</Badge>
              <Badge tone="neutral">Joined {formatDate(user.createdAt)}</Badge>
            </div>
          </div>

          {!editing && (
            <Button variant="outline" className="!w-auto" onClick={startEditing}>
              <LuPencil size={15} /> Edit Profile
            </Button>
          )}
        </div>

        {/* Body: read-only view OR edit form */}
        {!editing ? (
          <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
            <ProfileField label="Phone Number" value={user.phone || 'Not provided'} />
            <ProfileField label="Address" value={user.address || 'Not provided'} />
            <ProfileField label="Bio" value={user.bio || 'No bio added yet'} className="sm:col-span-2" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                label="Full name"
                name="name"
                error={errors.name}
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
              />
              <div>
                <Input
                  label="Phone number"
                  name="phone"
                  placeholder="9876543210"
                  error={errors.phone}
                  {...register('phone', {
                    pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian phone number' },
                  })}
                />
              </div>
            </div>

            <Input
              label="Address"
              name="address"
              placeholder="City, State"
              error={errors.address}
              {...register('address', { maxLength: { value: 200, message: 'Address is too long' } })}
            />

            <TextArea
              label="Bio"
              name="bio"
              placeholder="Tell us a bit about yourself"
              error={errors.bio}
              {...register('bio', { maxLength: { value: 300, message: 'Bio cannot exceed 300 characters' } })}
            />

            <div className="flex gap-3">
              <Button type="submit" loading={submitting} className="!w-auto">
                <LuCheck size={16} /> Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                className="!w-auto"
                onClick={() => setEditing(false)}
                disabled={submitting}
              >
                <LuX size={16} /> Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
};

const ProfileField = ({ label, value, className = '' }) => (
  <div className={className}>
    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
    <p className="mt-1 text-sm text-ink-900">{value}</p>
  </div>
);

export default Profile;

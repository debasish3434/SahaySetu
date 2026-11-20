import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LuKeyRound, LuBell, LuUserX, LuCheck } from 'react-icons/lu';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { changePasswordApi } from '../api/authApi.js';
import { updateSettingsApi } from '../api/userApi.js';
import { useNavigate } from 'react-router-dom';

const AccountSettings = () => {
  const { user, logout, updateUserInContext } = useAuth();
  const navigate = useNavigate();
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.settings?.notificationsEnabled ?? true
  );

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    watch,
    formState: { errors: passwordErrors },
  } = useForm();

  const newPasswordValue = watch('newPassword');

  const onChangePassword = async (formData) => {
    setPasswordLoading(true);
    try {
      const { data } = await changePasswordApi({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success(data.message || 'Password changed successfully');
      resetPasswordForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleNotificationToggle = async (e) => {
    const newValue = e.target.checked;
    setNotificationsEnabled(newValue);
    setSettingsLoading(true);
    try {
      const { data } = await updateSettingsApi({ notificationsEnabled: newValue });
      updateUserInContext(data.user);
      toast.success(`Notifications ${newValue ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setNotificationsEnabled(!newValue);
      toast.error(err.response?.data?.message || 'Failed to update notification settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      await updateSettingsApi({ isActive: false });
      toast.success('Your account has been deactivated');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate account');
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Account Settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Manage your password, preferences, and account status.
        </p>
      </div>

      {/* Change Password Card */}
      <div className="card">
        <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <LuKeyRound size={20} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">Change Password</h2>
            <p className="text-xs text-ink-500">Update your account password securely</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-5 pt-5">
          <Input
            label="Current password"
            type="password"
            name="currentPassword"
            placeholder="••••••••"
            error={passwordErrors.currentPassword}
            {...registerPassword('currentPassword', {
              required: 'Current password is required',
            })}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="New password"
              type="password"
              name="newPassword"
              placeholder="••••••••"
              error={passwordErrors.newPassword}
              {...registerPassword('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' },
                pattern: { value: /\d/, message: 'Must contain at least one number' },
              })}
            />

            <Input
              label="Confirm new password"
              type="password"
              name="confirmNewPassword"
              placeholder="••••••••"
              error={passwordErrors.confirmNewPassword}
              {...registerPassword('confirmNewPassword', {
                required: 'Please confirm your new password',
                validate: (value) => value === newPasswordValue || 'Passwords do not match',
              })}
            />
          </div>

          <Button type="submit" loading={passwordLoading} className="!w-auto">
            <LuCheck size={16} /> Update Password
          </Button>
        </form>
      </div>

      {/* Notification Preferences Card */}
      <div className="card">
        <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <LuBell size={20} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">Notifications</h2>
            <p className="text-xs text-ink-500">Control how and when you receive system alerts</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-5">
          <div>
            <p className="text-sm font-medium text-ink-900">Incident & Emergency Alerts</p>
            <p className="text-xs text-ink-500">Receive notifications for critical events near you</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={handleNotificationToggle}
              disabled={settingsLoading}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-ink-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
          </label>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div className="card border-danger-200 bg-danger-50/20">
        <div className="flex items-center gap-3 border-b border-danger-200 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-700">
            <LuUserX size={20} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-danger-900">Danger Zone</h2>
            <p className="text-xs text-danger-700">Deactivate your SahaySetu account</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ink-900">Deactivate Account</p>
            <p className="text-xs text-ink-500">
              Once deactivated, you will be logged out immediately. Reactivation requires administrator assistance.
            </p>
          </div>
          {!showDeactivateConfirm ? (
            <Button
              variant="danger"
              className="!w-auto shrink-0"
              onClick={() => setShowDeactivateConfirm(true)}
            >
              Deactivate Account
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="danger" className="!w-auto" onClick={handleDeactivateAccount}>
                Confirm Deactivation
              </Button>
              <Button
                variant="outline"
                className="!w-auto"
                onClick={() => setShowDeactivateConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AccountSettings;

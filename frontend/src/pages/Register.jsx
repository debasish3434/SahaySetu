import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  LuUser, LuMail, LuLock, LuPhone, LuEye, LuEyeOff, LuShieldCheck,
  LuClock, LuUserRound, LuHeartHandshake, LuMapPin, LuCircleCheck,
} from 'react-icons/lu';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import BridgeDivider from '../components/common/BridgeDivider.jsx';
import { useAuth } from '../hooks/useAuth.js';

// ✅ SECURITY: Admin is NOT listed here. Admin accounts are created only
// by the Super Admin via invitation from the Admin Management page.
const ROLES = [
  {
    value: 'citizen',
    label: 'Citizen',
    desc: 'Report incidents & get help',
    icon: LuUserRound,
    color: 'accent',
    note: 'Instant access after registration.',
  },
  {
    value: 'volunteer',
    label: 'Volunteer',
    desc: 'Assist on the ground',
    icon: LuHeartHandshake,
    color: 'brand',
    note: 'Use your username@sahaysetu.com email. Access starts after Super Admin approval.',
  },
  {
    value: 'coordinator',
    label: 'Coordinator',
    desc: 'Manage local relief ops',
    icon: LuMapPin,
    color: 'warning',
    note: 'Use your username@sahaysetu.com email. Access starts after Super Admin approval.',
  },
];

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: 'citizen' },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const selectedRole = watch('role');
  const needsApproval = selectedRole === 'volunteer' || selectedRole === 'coordinator';

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone?.replace(/\D/g, '').slice(-10) || undefined,
      };

      const result = await registerUser(payload);
      if (result.requiresApproval) {
        setApplicationSubmitted(true);
        toast.success('Application submitted for Super Admin approval.');
      } else {
        toast.success('Account created. You are signed in.');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message
        || err.response?.data?.message
        || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (applicationSubmitted) return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-5">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><LuCircleCheck size={28} /></span>
        <h1 className="mt-5 text-2xl font-bold text-ink-900">Application submitted</h1>
        <p className="mt-3 text-ink-600">Your {selectedRole} application is waiting for Super Admin approval. You can sign in after it is approved.</p>
        <Link to="/login" className="mt-6 inline-flex rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white">Go to sign in</Link>
      </section>
    </main>
  );

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-card overflow-hidden border border-surface-200"
      >
        <div className="bg-brand-900 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-black/10 rounded-full blur-2xl transform translate-x-12 translate-y-20" />
          <h1 className="text-3xl font-bold mb-2 relative z-10">Create Account</h1>
          <p className="text-blue-100/80 relative z-10">Join SahaySetu to make a difference</p>
        </div>

        <BridgeDivider className="text-accent-500 -mt-1" />

        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-3 flex items-center gap-2">
                <LuShieldCheck className="text-accent-500" />
                Select Your Role
              </label>
              <div className="grid sm:grid-cols-3 gap-3">
                {ROLES.map(role => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.value;
                  return (
                    <label
                      key={role.value}
                      className={`relative flex flex-col p-3 cursor-pointer rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-accent-500 bg-accent-50'
                          : 'border-ink-200 hover:border-accent-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={role.value}
                        className="sr-only"
                        {...register('role')}
                      />
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} className={isSelected ? 'text-accent-600' : 'text-ink-400'} />
                        <span className="font-semibold text-ink-900">{role.label}</span>
                      </div>
                      <span className="text-xs text-ink-500">{role.desc}</span>
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-accent-500" />
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Approval notice for volunteer/coordinator */}
              {needsApproval && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <LuClock className="text-amber-600 shrink-0 mt-0.5" size={15} />
                  <p className="text-xs text-amber-800">
                    <strong className="capitalize">{selectedRole}</strong> applications require Super Admin approval before dashboard access.
                  </p>
                </div>
              )}
            </div>

            {/* Name + Email */}
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                icon={LuUser}
                placeholder="Your full name"
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                error={errors.name?.message}
              />

              {/* All roles now use real email — no more @sahaysetu.com generation */}
              <Input
                label="Email Address"
                type="email"
                icon={LuMail}
                placeholder={needsApproval ? 'username@sahaysetu.com' : 'you@example.com'}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' },
                  validate: value => !needsApproval || value.trim().toLowerCase().endsWith('@sahaysetu.com') || 'Volunteer and coordinator accounts must use username@sahaysetu.com',
                })}
                error={errors.email?.message}
              />
              {needsApproval && <p className="-mt-4 text-xs text-ink-500 md:col-start-2">Use a <strong>username@sahaysetu.com</strong> address. Your application goes to the Super Admin for approval.</p>}
            </div>

            {/* Phone + Password */}
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Phone Number (optional)"
                type="tel"
                icon={LuPhone}
                placeholder="9876543210"
                {...register('phone', {
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number' },
                })}
                error={errors.phone?.message}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={LuLock}
                  placeholder="Min 8 chars with a number"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Must be at least 8 characters' },
                    pattern: { value: /\d/, message: 'Must contain at least one number' },
                  })}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-ink-400 hover:text-accent-500 transition-colors focus:outline-none"
                >
                  {showPassword ? <LuEyeOff size={20} /> : <LuEye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="accent"
              className="w-full text-lg py-3 mt-4"
              loading={submitting}
            >
              {needsApproval ? 'Submit Application' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center text-ink-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent-600 hover:text-accent-700 transition-colors">
              Sign in instead
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

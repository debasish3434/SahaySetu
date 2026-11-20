import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LuArrowUpRight, LuEye, LuEyeOff, LuLockKeyhole, LuMail, LuMapPinned, LuShieldCheck, LuTriangleAlert } from 'react-icons/lu';
import toast from 'react-hot-toast';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const result = await login(formData);
      navigate(result.passwordChangeRequired ? '/first-login-password' : redirectTo, { replace: true });
    } catch (err) {
      const code = err.response?.data?.code;
      if (['APPLICATION_PENDING', 'APPLICATION_REJECTED', 'ACCOUNT_DEACTIVATED'].includes(code)) {
        const status = code === 'APPLICATION_PENDING' ? 'pending' : code === 'APPLICATION_REJECTED' ? 'rejected' : 'deactivated';
        navigate(`/application-status?status=${status}`, { replace: true });
      } else {
        const message = err.response?.data?.message
          || (err.request
            ? 'Cannot reach the SahaySetu API. Check that MongoDB and the backend server are running, then try again.'
            : err.message || 'Login failed. Please try again.');
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.04fr_.96fr]">
      <section className="relative flex min-h-[250px] flex-col justify-between overflow-hidden bg-brand-900 px-6 py-7 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-16 h-96 w-96 rounded-full border border-white/[0.07]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 top-32 h-64 w-64 rounded-full border border-white/[0.07]" />
        <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-lg focus-visible:ring-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-900"><LuShieldCheck size={23} strokeWidth={2.2} /></span>
          <span><span className="block text-lg font-bold tracking-tight">SahaySetu</span><span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-blue-100/70">Response Network</span></span>
        </Link>

        <div className="relative z-10 my-10 max-w-xl lg:my-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-blue-100"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Community response, connected</div>
          <h1 className="max-w-lg text-3xl font-semibold leading-[1.1] tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">A clearer path from emergency to support.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/75 sm:text-base">Coordinate local response, connect people with help, and keep critical information in one trusted place.</p>

          <div className="mt-9 grid max-w-md gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/15 text-blue-200"><LuMapPinned size={18} /></span><span><strong className="block text-sm font-semibold">Local coordination</strong><span className="text-xs text-blue-100/60">Incidents, teams and shelters</span></span></div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200"><LuShieldCheck size={18} /></span><span><strong className="block text-sm font-semibold">Role-based access</strong><span className="text-xs text-blue-100/60">The right tools for each role</span></span></div>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-300/15 bg-amber-200/[0.06] p-4 text-sm text-blue-50/85"><LuTriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-300" /><p><strong className="font-semibold text-white">In immediate danger?</strong> Contact your local emergency services first.</p></div>
        </div>
        <p className="relative z-10 hidden text-xs text-blue-100/45 lg:block">&copy; 2026 SahaySetu · Disaster Response and Resource Coordination</p>
      </section>

      <section className="flex min-h-[calc(100vh-250px)] items-center justify-center px-5 py-10 sm:px-10 lg:min-h-screen lg:px-14">
        <div className="w-full max-w-md">
          <div className="mb-8"><p className="text-sm font-semibold text-accent-700">Welcome back</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">Sign in to SahaySetu</h2><p className="mt-2 text-sm text-ink-500">Use your registered email or administrator ID.</p></div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Email or administrator ID" name="email" type="text" icon={LuMail} autoComplete="username" placeholder="you@example.com or ADM-2026-000001" {...register('email', { required: 'Email or administrator ID is required', pattern: { value: /^(\S+@\S+\.\S+|ADM-\d{4}-\d{6})$/i, message: 'Enter a valid email or administrator ID' } })} error={errors.email} />
            <div className="relative">
              <Input label="Password" name="password" type={showPassword ? 'text' : 'password'} icon={LuLockKeyhole} autoComplete="current-password" placeholder="Enter your password" {...register('password', { required: 'Password is required' })} error={errors.password} />
              <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-[35px] rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-surface-100 hover:text-ink-700">{showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}</button>
            </div>
            <div className="flex justify-end"><Link to="/forgot-password" className="text-sm font-semibold text-accent-700 hover:text-accent-800">Forgot password?</Link></div>
            <Button type="submit" variant="accent" className="w-full" loading={submitting}>Sign in <LuArrowUpRight size={16} /></Button>
          </form>

          <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-surface-200" /><span className="text-xs text-ink-400">New to SahaySetu?</span><span className="h-px flex-1 bg-surface-200" /></div>
          <Link to="/register" className="flex min-h-11 w-full items-center justify-center rounded-xl border border-surface-200 px-4 text-sm font-semibold text-ink-700 transition-colors hover:border-accent-200 hover:bg-accent-50">Create an account</Link>
          <p className="mt-7 text-center text-xs leading-5 text-ink-400">Administrator access is invitation-only. Volunteer and coordinator access requires verification and approval.</p>
        </div>
      </section>
    </main>
  );
}

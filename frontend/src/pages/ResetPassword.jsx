import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LuLock, LuEye, LuEyeOff, LuArrowRight } from 'react-icons/lu';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import BridgeDivider from '../components/common/BridgeDivider.jsx';
import { resetPasswordApi } from '../api/authApi.js';

export default function ResetPassword() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { token } = useParams();
  const navigate = useNavigate();
  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await resetPasswordApi(token, { password: formData.password });
      toast.success('Password reset successfully!');
      
      // Redirect to login instead of auto-login since we might not have the email
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Link may be invalid or expired.');
    } finally {
      setSubmitting(false);
    }
  };

  const password = watch('password');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-accent-100"
      >
        <div className="bg-gradient-to-r from-accent-500 to-accent-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-16 -translate-y-16"></div>
          
          <h1 className="text-3xl font-bold mb-2 relative z-10">New Password</h1>
          <p className="text-accent-50 relative z-10">Secure your account</p>
        </div>
        
        <BridgeDivider className="text-accent-500 -mt-1" />

        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                icon={LuLock}
                placeholder="Enter new password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Must be at least 8 characters' },
                  pattern: { value: /\d/, message: 'Password must contain at least one number' }
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

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                icon={LuLock}
                placeholder="Confirm new password"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                error={errors.confirmPassword?.message}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[34px] text-ink-400 hover:text-accent-500 transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <LuEyeOff size={20} /> : <LuEye size={20} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="accent"
              className="w-full text-lg py-3 mt-4"
              loading={submitting}
            >
              Reset Password <LuArrowRight className="ml-2 inline" />
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link 
              to="/login" 
              className="text-sm font-semibold text-ink-500 hover:text-accent-600 transition-colors"
            >
              Cancel and return to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LuMail, LuArrowLeft, LuCircleCheck } from 'react-icons/lu';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import BridgeDivider from '../components/common/BridgeDivider.jsx';
import { forgotPasswordApi } from '../api/authApi.js';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const response = await forgotPasswordApi(formData);
      setIsSuccess(true);
      toast.success('Reset link sent to your email');
      
      // For dev purposes, show the link if API returns it
      if (response.data?.resetUrl) {
        setResetLink(response.data.resetUrl);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-accent-100"
      >
        <div className="bg-gradient-to-r from-accent-500 to-accent-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-16 -translate-y-16"></div>
          
          <h1 className="text-3xl font-bold mb-2 relative z-10">Reset Password</h1>
          <p className="text-accent-50 relative z-10">We&apos;ll help you get back in</p>
        </div>
        
        <BridgeDivider className="text-accent-500 -mt-1" />

        <div className="p-8 pt-6">
          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto">
                <LuCircleCheck size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-ink-900 mb-2">Check your email</h3>
                <p className="text-ink-600">
                  We&apos;ve sent password reset instructions to your email address.
                </p>
              </div>
              
              {resetLink && (
                <div className="p-4 bg-accent-50 border border-accent-200 rounded-xl mt-4">
                  <p className="text-sm font-medium text-accent-800 mb-2">Dev Mode: Reset Link</p>
                  <a href={resetLink} className="text-xs text-accent-600 break-all hover:underline">
                    {resetLink}
                  </a>
                </div>
              )}

              <Link 
                to="/login"
                className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-700 font-semibold mt-4 transition-colors"
              >
                <LuArrowLeft /> Back to Login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <p className="text-ink-600 mb-6 text-sm">
                Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
              </p>

              <Input
                label="Email Address"
                type="email"
                icon={LuMail}
                placeholder="Enter your email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' }
                })}
                error={errors.email?.message}
              />

              <Button
                type="submit"
                variant="accent"
                className="w-full text-lg py-3"
                isLoading={submitting}
              >
                Send Reset Link
              </Button>

              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 text-ink-500 hover:text-accent-600 font-medium transition-colors"
                >
                  <LuArrowLeft /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

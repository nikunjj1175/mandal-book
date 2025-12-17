import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useVerifyResetOtpMutation, useResetPasswordMutation } from '@/store/api/authApi';

export default function ResetPassword() {
  const router = useRouter();
  const emailFromQuery = typeof router.query.email === 'string' ? router.query.email : '';

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(emailFromQuery || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verifyResetOtp, { isLoading: verifying }] = useVerifyResetOtpMutation();
  const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await verifyResetOtp({ email, otp }).unwrap();
      toast.success('OTP verified. Please set a new password.');
      setStep(2);
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Invalid OTP');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    try {
      await resetPassword({ email, otp, newPassword }).unwrap();
      toast.success('Password updated successfully. Please log in.');
      router.push('/login');
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-slate-900/60 border border-gray-200 dark:border-slate-700 p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {step === 1 ? 'Verify OTP' : 'Set New Password'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {step === 1
              ? 'Enter the OTP sent to your email to continue.'
              : 'Choose a strong password and confirm it below.'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                placeholder="you@mandal-book.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                OTP Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                className="block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-gray-900 dark:text-gray-100 shadow-sm tracking-[0.4em] text-center focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 dark:shadow-blue-700/30 hover:brightness-110 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying OTP...' : 'Verify OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  className="block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 pr-11 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  placeholder="Create a secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.5 0-8.318-2.943-9.543-7a10.05 10.05 0 012.228-3.993M6.228 6.228A9.956 9.956 0 0112 5c4.5 0 8.318 2.943 9.543 7-1.274 4.057-5.019 7-9.542 7-4.523 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M2.458 12C3.732 7.943 7.477 5 12 5c4.523 0 8.268 2.943 9.542 7-1.274 4.057-5.019 7-9.542 7-4.523 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 pr-11 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  placeholder="Retype password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.5 0-8.318-2.943-9.543-7a10.05 10.05 0 012.228-3.993M6.228 6.228A9.956 9.956 0 0112 5c4.5 0 8.318 2.943 9.543 7-1.274 4.057-5.019 7-9.542 7-4.523 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M2.458 12C3.732 7.943 7.477 5 12 5c4.523 0 8.268 2.943 9.542 7-1.274 4.057-5.019 7-9.542 7-4.523 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={resetting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 dark:shadow-blue-700/30 hover:brightness-110 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetting ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400">
            Back to login
          </Link>
          <Link href="/forgot-password" className="hover:text-blue-600 dark:hover:text-blue-400">
            Resend OTP
          </Link>
        </div>
      </div>
    </div>
  );
}



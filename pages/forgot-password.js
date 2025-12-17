import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useForgotPasswordMutation } from '@/store/api/authApi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassword] = useForgotPasswordMutation();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword({ email }).unwrap();
      toast.success('If this email is registered, an OTP has been sent.');
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-slate-900/60 border border-gray-200 dark:border-slate-700 p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Forgot Password</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter your registered email. We&apos;ll send an OTP to reset your password.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
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
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 dark:shadow-blue-700/30 hover:brightness-110 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400">
            Back to login
          </Link>
          <Link href="/register" className="hover:text-blue-600 dark:hover:text-blue-400">
            Create new account
          </Link>
        </div>
      </div>
    </div>
  );
}



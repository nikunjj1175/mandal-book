import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success(result.message || 'Login successful!');
        router.push('/dashboard');
      } else {
        if (result.code === 'EMAIL_NOT_VERIFIED') {
          toast.error('Please verify your email via OTP first.');
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        } else {
          toast.error(result.error || 'Login failed');
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-12 text-slate-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_55%)]" />
          <div className="relative space-y-8 max-w-lg">
            <span className="inline-flex w-fit rounded-full border border-slate-700 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
              Mandal-Book Platform
            </span>
            <div>
              <h1 className="text-4xl font-bold leading-tight text-white">
                Bring total clarity to every mandal contribution.
              </h1>
              <p className="mt-4 text-slate-200 text-lg">
                Track UPI slips, auto-capture reference IDs, enforce KYC, and keep every rupee accounted for inside
                your community fund.
              </p>
            </div>
            <ul className="space-y-4 text-base text-slate-200">
              {[
                'Real-time dashboards for admins & members',
                'Auto OCR for UPI payment proof',
                'Human approvals with digital audit trails',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative text-sm text-slate-400">
            © {new Date().getFullYear()} Mandal-Book. Secure community finance workspace.
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-4 text-center lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Welcome back</p>
              <h2 className="text-3xl font-bold text-slate-900">Sign in to Mandal-Book</h2>
              <p className="text-slate-500">
                Access contribution records, approvals, and loan workflows in a single secured hub.
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="you@mandal-book.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <p className="text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
                  Register for Mandal-Book
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}


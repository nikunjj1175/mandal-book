import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      const result = await register(userData);
      if (result.success) {
        toast.success(result.message || 'Registration successful! Please verify OTP.');
        router.push(`/verify-otp?email=${encodeURIComponent(result.email || userData.email)}`);
      } else {
        toast.error(result.error || 'Registration failed');
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
        <section className="relative hidden lg:flex flex-col justify-between bg-gradient-to-b from-emerald-900 via-slate-900 to-slate-950 p-12 text-slate-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(22,163,74,0.18),_transparent_45%)]" />
          <div className="relative space-y-8 max-w-xl">
            <span className="inline-flex w-fit rounded-full border border-emerald-400/30 px-4 py-1 text-xs uppercase tracking-[0.3em] text-emerald-100">
              Join Mandal-Book
            </span>
            <div>
              <h1 className="text-4xl font-bold leading-tight text-white">
                Digitize community savings with trust & compliance.
              </h1>
              <p className="mt-4 text-slate-200 text-lg">
                Member onboarding comes with OTP verification, full KYC capture, and admin approvals before any funds
                move.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['OTP + KYC', 'Secure identity checks for every member'],
                ['UPI Tracking', 'Proof-backed contributions & OCR'],
                ['Loan Desk', 'Interest, EMIs and repayments in sync'],
                ['Alerts', 'Email + in-app notifications'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-slate-200">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative text-sm text-slate-400">
            Trusted by mandals and rotating savings groups across India.
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-4 text-center lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Create account</p>
              <h2 className="text-3xl font-bold text-slate-900">Start building transparent mandals</h2>
              <p className="text-slate-500">
                Set up your profile, verify via OTP, and submit KYC to unlock contribution management, loan workflows,
                and admin dashboards.
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {[
                  { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Priya Shah' },
                  { id: 'email', label: 'Email', type: 'email', placeholder: 'priya@mandal-book.com' },
                  { id: 'mobile', label: 'Mobile Number', type: 'tel', placeholder: '98765 43210' },
                ].map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label htmlFor={field.id} className="text-sm font-medium text-slate-700">
                      {field.label}
                    </label>
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      required
                      className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder={field.placeholder}
                      value={formData[field.id]}
                      onChange={handleChange}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Retype password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already joined Mandal-Book?{' '}
                <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-500">
                  Sign in here
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}


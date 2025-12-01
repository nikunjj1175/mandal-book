import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useTranslation } from '@/lib/useTranslation';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('register.passwordsNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t('register.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      const result = await register(userData);
      if (result.success) {
        toast.success(result.message || t('register.success'));
        router.push(`/verify-otp?email=${encodeURIComponent(result.email || userData.email)}`);
      } else {
        toast.error(result.error || t('register.errorOccurred'));
      }
    } catch (error) {
      toast.error(t('register.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side - Branding Section */}
        <section className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 sm:p-12 text-white overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className={`relative space-y-6 sm:space-y-8 max-w-xl transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex w-fit rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/90 animate-fade-in">
              Join Mandal-Book
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-white animate-slide-up">
                Digitize community savings with trust & compliance.
              </h1>
              <p className="text-white/90 text-lg leading-relaxed animate-slide-up delay-200">
                Member onboarding comes with OTP verification, full KYC capture, and admin approvals before any funds
                move.
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              {[
                ['OTP + KYC', 'Secure identity checks for every member'],
                ['UPI Tracking', 'Proof-backed contributions & OCR'],
                ['Loan Desk', 'Interest, EMIs and repayments in sync'],
                ['Alerts', 'Email + in-app notifications'],
              ].map(([title, desc], index) => (
                <div 
                  key={title} 
                  className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 hover:bg-white/15 transition-all duration-300 hover:scale-105 animate-slide-up"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  <p className="text-sm font-semibold text-white mb-1">{title}</p>
                  <p className="text-xs sm:text-sm text-white/90">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative text-sm text-white/70 animate-fade-in">
            Trusted by mandals and rotating savings groups across India.
          </div>
        </section>

        {/* Right Side - Registration Form */}
        <section className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 lg:px-12 overflow-y-auto">
          <div className={`w-full max-w-md space-y-6 sm:space-y-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="space-y-3 sm:space-y-4 text-center lg:text-left">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 animate-fade-in">
                {t('register.title')}
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 animate-slide-up">
                {t('register.subtitle')}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 animate-slide-up delay-200">
                {t('register.subtitle')}
              </p>
            </div>
            <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {[
                  { id: 'name', label: t('register.name'), type: 'text', placeholder: t('register.name') },
                  { id: 'email', label: t('register.email'), type: 'email', placeholder: t('register.email') },
                  { id: 'mobile', label: t('register.mobile'), type: 'tel', placeholder: t('register.mobile') },
                ].map((field, index) => (
                  <div 
                    key={field.id} 
                    className="space-y-1.5 animate-slide-up"
                    style={{ animationDelay: `${300 + index * 100}ms` }}
                  >
                    <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      required
                      className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:border-gray-300"
                      placeholder={field.placeholder}
                      value={formData[field.id]}
                      onChange={handleChange}
                    />
                  </div>
                ))}
                <div className="space-y-1.5 animate-slide-up delay-600">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {t('register.password')}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:border-gray-300"
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5 animate-slide-up delay-700">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    {t('register.confirmPassword')}
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:border-gray-300"
                    placeholder="Retype password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-slide-up delay-800"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {t('register.registering')}
                  </span>
                ) : (
                  t('register.registerButton')
                )}
              </button>

              <p className="text-center text-sm text-gray-600 animate-fade-in delay-900">
                {t('register.haveAccount')}{' '}
                <Link 
                  href="/login" 
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 underline-offset-2 hover:underline"
                >
                  {t('register.login')}
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .delay-200 {
          animation-delay: 200ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-600 {
          animation-delay: 600ms;
        }

        .delay-700 {
          animation-delay: 700ms;
        }

        .delay-800 {
          animation-delay: 800ms;
        }

        .delay-900 {
          animation-delay: 900ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
}


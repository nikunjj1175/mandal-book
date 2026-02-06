import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useTranslation } from '@/lib/useTranslation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success(result.message || t('login.loginSuccess'));
        router.push('/dashboard');
      } else {
        if (result.code === 'EMAIL_NOT_VERIFIED') {
          toast.error(t('login.emailNotVerified'));
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        } else {
          toast.error(result.error || t('login.loginFailed'));
        }
      }
    } catch (error) {
      toast.error(t('login.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side - Branding Section */}
        <section className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 dark:from-blue-600 dark:via-indigo-700 dark:to-purple-700 p-8 sm:p-12 text-white overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className={`relative space-y-8 max-w-lg transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex w-fit rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/90 animate-fade-in">
              Mandal-Book Platform
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-white animate-slide-up">
                Bring total clarity to every mandal contribution.
              </h1>
              <p className="text-white/90 text-lg leading-relaxed animate-slide-up delay-200">
                Track UPI slips, auto-capture reference IDs, enforce KYC, and keep every rupee accounted for inside
                your community fund.
              </p>
            </div>
            <ul className="space-y-4 text-base text-white/90">
              {[
                'Real-time dashboards for admins & members',
                'Auto OCR for UPI payment proof',
                'Human approvals with digital audit trails',
              ].map((item, index) => (
                <li 
                  key={item} 
                  className="flex items-start gap-3 animate-slide-up"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white flex-shrink-0">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative text-sm text-white/70 animate-fade-in">
            © {new Date().getFullYear()} Mandal-Book. Secure community finance workspace.
          </div>
        </section>

        {/* Right Side - Login Form */}
        <section className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 lg:px-12">
          <div className={`w-full max-w-md space-y-6 sm:space-y-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Logo for Mobile/Tablet */}
            <div className="flex justify-center lg:hidden mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg flex items-center justify-center p-2">
                  <img
                    src="/mandal-logo.svg"
                    alt="Mandal-Book Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Mandal-Book</span>
                  <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Group Finance</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4 text-center lg:text-left">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400 animate-fade-in">
                {t('login.subtitle')}
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 animate-slide-up">
                {t('login.title')}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 animate-slide-up delay-200">
                {t('login.subtitle')}
              </p>
            </div>
            <form className="mt-6 sm:mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-1.5 animate-slide-up delay-300">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('login.email')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 hover:border-gray-300 dark:hover:border-slate-500"
                    placeholder="you@mandal-book.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 animate-slide-up delay-400">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('login.password')}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 pr-11 text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 hover:border-gray-300 dark:hover:border-slate-500"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.5 0-8.318-2.943-9.543-7a10.05 10.05 0 012.228-3.993M6.228 6.228A9.956 9.956 0 0112 5c4.5 0 8.318 2.943 9.543 7a10.05 10.05 0 01-4.132 5.225M15 12a3 3 0 00-3-3m0 0a2.997 2.997 0 00-2.003.764M12 9v.01M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
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
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 dark:shadow-blue-700/30 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-blue-600/40 dark:hover:shadow-blue-700/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-slide-up delay-500"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {t('login.loggingIn')}
                  </span>
                ) : (
                  t('login.loginButton')
                )}
              </button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 animate-fade-in delay-600">
                {t('login.noAccount')}{' '}
                <Link 
                  href="/register" 
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 underline-offset-2 hover:underline"
                >
                  {t('login.register')}
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

        .delay-400 {
          animation-delay: 400ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-600 {
          animation-delay: 600ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
}

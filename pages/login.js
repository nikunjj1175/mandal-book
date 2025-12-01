import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useTranslation } from '@/lib/useTranslation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side - Branding Section */}
        <section className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8 sm:p-12 text-white overflow-hidden">
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
            <div className="space-y-3 sm:space-y-4 text-center lg:text-left">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-blue-600 animate-fade-in">
                {t('login.subtitle')}
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 animate-slide-up">
                {t('login.title')}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 animate-slide-up delay-200">
                {t('login.subtitle')}
              </p>
            </div>
            <form className="mt-6 sm:mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-1.5 animate-slide-up delay-300">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {t('login.email')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300"
                    placeholder="you@mandal-book.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 animate-slide-up delay-400">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {t('login.password')}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-slide-up delay-500"
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

              <p className="text-center text-sm text-gray-600 animate-fade-in delay-600">
                {t('login.noAccount')}{' '}
                <Link 
                  href="/register" 
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 underline-offset-2 hover:underline"
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


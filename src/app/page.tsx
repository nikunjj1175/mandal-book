import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session);
  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 sm:p-12 shadow-xl">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        </div>
        
        <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                Welcome to Mandal Book
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 sm:text-xl leading-relaxed">
              Group savings, admin approvals, secure KYC, and monthly reminders — all in one colorful, fast, and responsive app.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {!isLoggedIn ? (
                <>
                  <Link 
                    href="/signin" 
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                  >
                    <span className="relative z-10">Sign in</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  <Link 
                    href="/signup" 
                    className="group relative overflow-hidden rounded-xl border-2 border-gray-300 px-8 py-4 font-semibold transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 hover:scale-105"
                  >
                    Create account
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/dashboard" 
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-4 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                  >
                    <span className="relative z-10">Go to Dashboard</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  <Link 
                    href="/profile" 
                    className="group relative overflow-hidden rounded-xl border-2 border-gray-300 px-8 py-4 font-semibold transition-all duration-300 hover:border-green-500 hover:bg-green-50 hover:scale-105"
                  >
                    Profile
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="relative mx-auto hidden h-48 w-48 shrink-0 sm:block sm:h-64 sm:w-64 lg:h-80 lg:w-80">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 blur-2xl animate-pulse"></div>
            <div className="absolute inset-4 rounded-2xl border bg-white/80 backdrop-blur-xl shadow-2xl">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📚</div>
                  <div className="text-sm font-medium text-gray-600">Secure. Simple. Social.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link 
          href="/dashboard" 
          className="group relative overflow-hidden rounded-2xl border bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="mb-4 text-3xl">📊</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Dashboard</h3>
            <p className="text-gray-600">View balance, dues, and activity with beautiful analytics.</p>
          </div>
        </Link>
        
        <Link 
          href="/profile" 
          className="group relative overflow-hidden rounded-2xl border bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-purple-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="mb-4 text-3xl">👤</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Profile</h3>
            <p className="text-gray-600">Manage your account details and preferences.</p>
          </div>
        </Link>
        
        <Link 
          href="/contributions" 
          className="group relative overflow-hidden rounded-2xl border bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-green-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="mb-4 text-3xl">💰</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Contributions</h3>
            <p className="text-gray-600">Submit and track your payments with ease.</p>
          </div>
        </Link>
        
        <Link 
          href="/kyc" 
          className="group relative overflow-hidden rounded-2xl border bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-orange-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="mb-4 text-3xl">🆔</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">KYC</h3>
            <p className="text-gray-600">Update Aadhaar/PAN and bank information securely.</p>
          </div>
        </Link>
        
        {isAdmin && (
          <Link 
            href="/admin" 
            className="group relative overflow-hidden rounded-2xl border bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-red-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="mb-4 text-3xl">⚙️</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Admin</h3>
              <p className="text-gray-600">Approve users and manage system settings.</p>
            </div>
          </Link>
        )}
        
        <Link 
          href="/upload" 
          className="group relative overflow-hidden rounded-2xl border bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-teal-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="mb-4 text-3xl">📤</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Upload documents</h3>
            <p className="text-gray-600">Try signed file uploads and cloud storage.</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { User, Mail, Shield, Calendar, Edit, ArrowRight } from 'lucide-react';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="space-y-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Access Required</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
            You need to sign in to access your profile and manage your account details.
          </p>
          <Link 
            href="/signin" 
            className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Sign in to Continue
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="card p-8">
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {session.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{session.user?.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">Account Information</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                <p className="text-gray-900 dark:text-gray-100 font-semibold">{session.user?.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                <p className="text-gray-900 dark:text-gray-100 font-semibold">{session.user?.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Role</p>
                <p className="text-gray-900 dark:text-gray-100 font-semibold capitalize">
                  {(session.user as any)?.role || 'member'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="text-gray-900 dark:text-gray-100 font-semibold">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/kyc" 
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Edit className="h-5 w-5" />
              <span>Update KYC Information</span>
            </Link>
            
            <Link 
              href="/dashboard" 
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">0</div>
          <p className="text-gray-600 dark:text-gray-400">Total Contributions</p>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">₹0</div>
          <p className="text-gray-600 dark:text-gray-400">Amount Contributed</p>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">0</div>
          <p className="text-gray-600 dark:text-gray-400">Pending Approvals</p>
        </div>
      </div>
    </div>
  );
}
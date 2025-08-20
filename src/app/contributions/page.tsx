import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import UserContributionsClient from '@/components/UserContributionsClient';

export default async function ContributionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">💰</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to manage your contributions.
          </p>
          <a 
            href="/signin"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <span>Sign In</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            My Contributions
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Submit monthly contributions and track your payment history
        </p>
      </div>

      {/* Contributions Client */}
      <UserContributionsClient />
    </div>
  );
}
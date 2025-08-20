import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import DashboardClient from '@/components/DashboardClient';

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="space-y-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-gray-800">Access Required</h1>
          <p className="text-lg text-gray-600 max-w-md">
            You need to sign in to access your dashboard and view your contributions.
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
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Welcome back, <span className="font-semibold text-gray-800">{session.user?.name}</span>! 
          Here&apos;s your contribution overview.
        </p>
      </div>
      <DashboardClient />
    </div>
  );
}
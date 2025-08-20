import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const DashboardCharts = dynamic(() => import('./charts-client'), { ssr: false });

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">You are not signed in.</p>
        <Link href="/signin" className="mt-3 inline-block rounded-md border px-3 py-2 text-sm hover:bg-accent">Sign in</Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome, {session.user?.name}</p>
      </div>
      <DashboardCharts />
    </div>
  );
}
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

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
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Welcome, {session.user?.name}</p>
    </div>
  );
}
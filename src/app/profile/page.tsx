import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function ProfilePage() {
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
      <h1 className="text-xl font-semibold">Your profile</h1>
      <div className="rounded-md border p-4 text-sm">
        <p><span className="font-medium">Name:</span> {session.user?.name}</p>
        <p><span className="font-medium">Email:</span> {session.user?.email}</p>
        <p><span className="font-medium">Role:</span> {(session.user as any)?.role || 'member'}</p>
      </div>
      <Link href="/kyc" className="inline-block rounded-md border px-3 py-2 text-sm hover:bg-accent">Update KYC</Link>
    </div>
  );
}
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session);
  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Welcome to Mandal Book</h1>
        <p className="text-muted-foreground">Group savings, admin approvals, secure KYC, and monthly reminders.</p>
      </section>

      {!isLoggedIn ? (
        <section className="flex flex-wrap gap-3">
          <Link href="/signin" className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Sign in</Link>
          <Link href="/signup" className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Create account</Link>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard" className="rounded-lg border p-4 hover:bg-accent">
            <p className="font-medium">Dashboard</p>
            <p className="text-sm text-muted-foreground">View balance, dues, and activity.</p>
          </Link>
          <Link href="/profile" className="rounded-lg border p-4 hover:bg-accent">
            <p className="font-medium">Profile</p>
            <p className="text-sm text-muted-foreground">View your account details.</p>
          </Link>
          <Link href="/kyc" className="rounded-lg border p-4 hover:bg-accent">
            <p className="font-medium">KYC</p>
            <p className="text-sm text-muted-foreground">Update Aadhaar/PAN and bank info.</p>
          </Link>
          {isAdmin && (
            <Link href="/admin" className="rounded-lg border p-4 hover:bg-accent">
              <p className="font-medium">Admin</p>
              <p className="text-sm text-muted-foreground">Approve users and manage settings.</p>
            </Link>
          )}
        </section>
      )}

      <section className="rounded-lg border p-4 text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">First time setup</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>Seed an admin via POST <code>/api/seed-admin</code> with email and password.</li>
          <li>Sign in using the admin account.</li>
          <li>Open Admin → Pending users to approve registrations.</li>
        </ol>
      </section>
    </div>
  );
}
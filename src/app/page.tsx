import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session);
  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-card/60 p-6 sm:p-10">
        <div className="absolute inset-0 -z-10 animate-gradient bg-[linear-gradient(135deg,#f472b644,#60a5fa44,#34d39944)]" />
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span className="gradient-text">Welcome to Mandal Book</span>
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Group savings, admin approvals, secure KYC, and monthly reminders — all in one colorful, fast, and responsive app.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {!isLoggedIn ? (
                <>
                  <Link href="/signin" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:shadow-md">
                    Sign in
                  </Link>
                  <Link href="/signup" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
                    Create account
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:shadow-md">
                    Go to Dashboard
                  </Link>
                  <Link href="/profile" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
                    Profile
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="relative mx-auto hidden h-40 w-40 shrink-0 sm:block sm:h-52 sm:w-52">
            <div className="animate-blob absolute inset-0 rounded-full bg-gradient-to-tr from-pink-400/40 via-sky-400/40 to-emerald-400/40 blur-2xl" />
            <div className="absolute inset-4 rounded-xl border bg-background/60 backdrop-blur">
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Secure. Simple. Social.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard" className="group relative overflow-hidden rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-tr from-sky-400/20 to-emerald-400/20 blur-2xl" />
          <p className="font-semibold">Dashboard</p>
          <p className="text-sm text-muted-foreground">View balance, dues, and activity.</p>
        </Link>
        <Link href="/profile" className="group relative overflow-hidden rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-tr from-fuchsia-400/20 to-amber-400/20 blur-2xl" />
          <p className="font-semibold">Profile</p>
          <p className="text-sm text-muted-foreground">View your account details.</p>
        </Link>
        <Link href="/contributions" className="group relative overflow-hidden rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 blur-2xl" />
          <p className="font-semibold">Contributions</p>
          <p className="text-sm text-muted-foreground">Submit and view your payments.</p>
        </Link>
        <Link href="/kyc" className="group relative overflow-hidden rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-tr from-emerald-400/20 to-sky-400/20 blur-2xl" />
          <p className="font-semibold">KYC</p>
          <p className="text-sm text-muted-foreground">Update Aadhaar/PAN and bank info.</p>
        </Link>
        {isAdmin && (
          <Link href="/admin" className="group relative overflow-hidden rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-tr from-rose-400/20 to-violet-400/20 blur-2xl" />
            <p className="font-semibold">Admin</p>
            <p className="text-sm text-muted-foreground">Approve users and manage settings.</p>
          </Link>
        )}
        <Link href="/upload" className="group relative overflow-hidden rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-tr from-amber-400/20 to-lime-400/20 blur-2xl" />
          <p className="font-semibold">Upload demo</p>
          <p className="text-sm text-muted-foreground">Try signed file uploads.</p>
        </Link>
      </section>

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
"use client";
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function AuthControls() {
  const { data: session, status } = useSession();

  if (status === 'loading') return null;

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/signin" className="rounded-md border px-3 py-2 text-sm hover:bg-accent">Sign in</Link>
        <Link href="/signup" className="rounded-md border px-3 py-2 text-sm hover:bg-accent">Sign up</Link>
      </div>
    );
  }

  const isAdmin = (session.user as any)?.role === 'admin';
  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard" className="rounded-md border px-3 py-2 text-sm hover:bg-accent">Dashboard</Link>
      {isAdmin && (
        <Link href="/admin/users" className="rounded-md border px-3 py-2 text-sm hover:bg-accent">Admin</Link>
      )}
      <Link href="/profile" className="rounded-md border px-3 py-2 text-sm hover:bg-accent">Profile</Link>
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
      >
        Log out
      </button>
    </div>
  );
}
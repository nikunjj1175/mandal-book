import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/contributions', label: 'Contributions' },
  { href: '/loans', label: 'Loans' },
  { href: '/members', label: 'Members' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return <>{children}</>;
  }

  const isAdmin = user.role === 'admin';

  const linkClass = (path) =>
    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition ${
      router.pathname === path
        ? 'border-primary-600 text-slate-900'
        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white/90 border-b border-slate-200 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20">
                  <img
                    src="/mandal-logo.svg"
                    alt="Mandal-Book Logo"
                    className="h-6 w-6"
                    aria-hidden="true"
                    loading="lazy"
                  />
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-semibold text-slate-900">Mandal-Book</span>
                  <span className="text-xs uppercase tracking-widest text-slate-500">Group Finance Desk</span>
                </div>
              </Link>
              <div className="hidden sm:flex sm:space-x-8">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                    {link.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link href="/admin" className={linkClass('/admin')}>
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-medium text-slate-900">{user.name}</span>
                <span className="text-xs text-slate-500 capitalize">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-rose-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:brightness-110"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 opacity-60" aria-hidden="true">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-br from-blue-50 via-indigo-50 to-transparent blur-3xl" />
        </div>
        {children}
      </main>
    </div>
  );
}


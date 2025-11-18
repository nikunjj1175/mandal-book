import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    return <>{children}</>;
  }

  const isAdmin = user.role === 'admin';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/contributions', label: 'Contributions' },
    { href: '/loans', label: 'Loans' },
    { href: '/members', label: 'Members' },
    { href: '/profile', label: 'Profile' },
  ];

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
                {navLinks.map((link) => (
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
              <button
                className="sm:hidden inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-900"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
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
        {mobileOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 pb-4 pt-2 space-y-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900">{user.name}</span>
              <span className="text-xs text-slate-500 capitalize">{user.role}</span>
            </div>
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-2 text-sm font-medium ${
                    router.pathname === link.href ? 'text-blue-600' : 'text-slate-600'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`py-2 text-sm font-medium ${
                    router.pathname === '/admin' ? 'text-blue-600' : 'text-slate-600'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="py-2 text-left text-sm font-semibold text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        )}
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


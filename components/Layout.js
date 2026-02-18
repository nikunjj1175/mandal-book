import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/lib/useTranslation';
import NotificationSystem from './NotificationSystem';
import ChatWidget from './ChatWidget';
import DeactivatedMessage from './DeactivatedMessage';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useTranslation();
  const userDropdownRef = useRef(null);

  // Mobile drawer: lock scroll + close on ESC
  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userDropdownOpen) return;

    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  if (!user) {
    return <>{children}</>;
  }

  // Show deactivation message if user is deactivated
  if (user.isActive === false) {
    return <DeactivatedMessage />;
  }

  const isAdmin = user.role === 'admin';
  const isMember = user.role === 'member';
  const kycIncomplete =
    isMember &&
    user.adminApprovalStatus === 'approved' &&
    user.kycStatus !== 'verified';

  const navLinks = [
    { href: '/dashboard', label: t('nav.dashboard') },
    ...(!isAdmin ? [
      { href: '/contributions', label: t('nav.contributions') },
      { href: '/loans', label: t('nav.loans') },
    ] : []),
    { href: '/members', label: t('nav.members') },
    { href: '/login-history', label: t('nav.loginHistory') },
    { href: '/profile', label: t('nav.profile') },
  ];

  const navIcon = (href) => {
    const common = 'h-5 w-5';
    switch (href) {
      case '/dashboard':
        return (
          <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
          </svg>
        );
      case '/contributions':
        return (
          <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10V6m0 12v2m9-8a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case '/loans':
        return (
          <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10V6m0 12v2M5 12a7 7 0 0114 0M5 12a7 7 0 0014 0M5 12H3m18 0h-2" />
          </svg>
        );
      case '/members':
        return (
          <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H2v-2a4 4 0 013-3.87m13-3.13a4 4 0 10-8 0 4 4 0 008 0zM6 11a4 4 0 118 0 4 4 0 01-8 0z" />
          </svg>
        );
      case '/login-history':
        return (
          <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case '/profile':
        return (
          <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case '/admin':
        return (
          <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.59 21 9a12.02 12.02 0 00-.382-3.016z" />
          </svg>
        );
      default:
        return (
          <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const linkClass = (path) =>
    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
      router.pathname === path
        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors" data-lang={language}>
      <nav
        className="bg-white/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-800/80 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-12 sm:h-14 md:h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 flex-1 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-2 sm:gap-2.5 md:gap-3 px-1.5 py-1.5 sm:py-2 flex-shrink-0 hover:opacity-80 transition-opacity group">
                <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 lg:h-12 lg:w-12 items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md sm:shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/30 transition-shadow">
                  <img
                    src="/mandal-logo.svg"
                    alt="Mandal-Book Logo"
                    className="h-full w-full p-1.5 sm:p-2 object-contain"
                    aria-hidden="true"
                    loading="eager"
                  />
                </span>
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-sm sm:text-base md:text-lg lg:text-xl font-extrabold tracking-tight whitespace-nowrap bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-transparent bg-clip-text">
                    Mandal-Book
                  </span>
                  <span className="hidden sm:inline text-[10px] sm:text-[11px] md:text-xs lg:text-sm uppercase tracking-wider sm:tracking-widest text-slate-500 dark:text-slate-400">
                    Group Finance
                  </span>
                </div>
              </Link>
              
              {/* Desktop Navigation - Show from md breakpoint */}
              <div className="hidden md:flex md:space-x-4 lg:space-x-6 xl:space-x-8">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                    {link.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link href="/admin" className={linkClass('/admin')}>
                    {t('nav.admin')}
                  </Link>
                )}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0 md:ml-4 lg:ml-6 pl-1 md:pl-3 border-l border-transparent md:border-slate-200/60 dark:md:border-slate-700/60">
              {/* Notification System - Always visible */}
              <div className="block">
                <NotificationSystem />
              </div>
              
              {/* Mobile Menu Button */}
              <button
                className="md:hidden inline-flex items-center justify-center rounded-full p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-drawer"
              >
                {mobileOpen ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {/* User Dropdown - Desktop (hidden on mobile/tablet) */}
              <div className="hidden md:block relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[140px] xl:max-w-[180px]">
                      {user.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {user.role}
                    </span>
                  </div>
                  <svg
                    className={`h-4 w-4 text-slate-600 dark:text-slate-400 transition-transform ${
                      userDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                        {user.role}
                      </p>
                    </div>

                    {/* Theme Toggle */}
                    <button
                      onClick={() => {
                        toggleTheme();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                    >
                      {isDark ? (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>Light Mode</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                          <span>Dark Mode</span>
                        </>
                      )}
                    </button>

                    {/* Language Selector */}
                    <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                        Language
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            changeLanguage('en');
                            setUserDropdownOpen(false);
                          }}
                          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                            language === 'en'
                              ? 'bg-blue-600 text-white dark:bg-blue-500'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          English
                        </button>
                        <button
                          onClick={() => {
                            changeLanguage('gu');
                            setUserDropdownOpen(false);
                          }}
                          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                            language === 'gu'
                              ? 'bg-blue-600 text-white dark:bg-blue-500'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          ગુજરાતી
                        </button>
                      </div>
                    </div>

                    {/* Logout Button */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-0 z-[60] ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
          className={`absolute left-0 top-0 h-full w-[86vw] max-w-[360px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-200 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Drawer Header */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 min-w-0"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20">
                    <img
                      src="/mandal-logo.svg"
                      alt="Mandal-Book Logo"
                      className="h-full w-full p-2 object-contain"
                      aria-hidden="true"
                      loading="eager"
                    />
                  </span>
                  <div className="min-w-0 leading-tight">
                    <div className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                      Mandal-Book
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 truncate">
                      Group finance
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation drawer"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Card */}
              <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-200 dark:to-slate-400 text-white dark:text-slate-900 flex items-center justify-center font-bold">
                    {(user.name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">
                      {user.role}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const active = router.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                          active
                            ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300'
                            : 'bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-white dark:group-hover:bg-slate-900'
                        }`}
                      >
                        {navIcon(link.href)}
                      </span>
                      <span className="min-w-0 truncate">{link.label}</span>
                    </Link>
                  );
                })}

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      router.pathname === '/admin'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                        router.pathname === '/admin'
                          ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300'
                          : 'bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-white dark:group-hover:bg-slate-900'
                      }`}
                    >
                      {navIcon('/admin')}
                    </span>
                    <span className="min-w-0 truncate">{t('nav.admin')}</span>
                  </Link>
                )}
              </div>

              {/* Preferences */}
              <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full px-3 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {isDark ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                    </span>
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{isDark ? 'ON' : 'OFF'}</span>
                </button>

                <div className="border-t border-slate-200 dark:border-slate-800 px-3 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    Language
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeLanguage('en')}
                      className={`flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition ${
                        language === 'en'
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => changeLanguage('gu')}
                      className={`flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition ${
                        language === 'gu'
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      ગુજરાતી
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-3">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="w-full rounded-2xl px-3 py-3 text-left text-sm font-extrabold text-red-600 dark:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors flex items-center gap-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900 text-red-600 dark:text-red-300">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                <span className="truncate">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="absolute inset-0 -z-10 opacity-50 dark:opacity-30" aria-hidden="true">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 blur-3xl" />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 blur-3xl" />
        </div>

        {/* Global KYC reminder banner for members */}
        {kycIncomplete && (
          <div className="mb-4 sm:mb-5 rounded-xl border border-yellow-200 dark:border-yellow-700 bg-yellow-50/90 dark:bg-yellow-900/20 px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 text-sm font-semibold">
                !
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  KYC pending – કૃપા કરીને તમારા Aadhaar / PAN / Bank દસ્તાવેજો અપલોડ કરો જેથી તમામ services use કરી શકો.
                </p>
                <p className="text-[11px] sm:text-xs text-yellow-800/80 dark:text-yellow-200/80 mt-1">
                  Without completed KYC, તમે contribution upload, loan request જેવી सुविधा ઉપયોગ કરી શકશો નહીં.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/kyc')}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-yellow-600 text-white text-xs sm:text-sm font-semibold hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-400 transition-colors shadow-sm"
            >
              Complete KYC
            </button>
          </div>
        )}

        {children}
      </main>

      {/* Floating Chat Widget - chatbot style */}
      <ChatWidget />
    </div>
  );
}
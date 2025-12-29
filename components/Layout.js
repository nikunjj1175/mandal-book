import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/lib/useTranslation';
import NotificationSystem from './NotificationSystem';
import DeactivatedMessage from './DeactivatedMessage';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useTranslation();
  const navRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Close mobile menu on outside click (mobile only)
  useEffect(() => {
    if (!mobileOpen) return;

    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
  const isSuperAdmin = user.role === 'super_admin';
  const isMember = user.role === 'member';
  const kycIncomplete =
    isMember &&
    user.adminApprovalStatus === 'approved' &&
    user.kycStatus !== 'verified';

  const navLinks = [
    { href: '/dashboard', label: t('nav.dashboard') },
    // Contributions & Loans: only for members (not admins or super admins)
    ...(isMember
      ? [
          { href: '/contributions', label: t('nav.contributions') },
          { href: '/loans', label: t('nav.loans') },
        ]
      : []),
    // Members page: for admin only (super admin uses Admin Console instead)
    ...(isAdmin ? [{ href: '/members', label: t('nav.members') }] : []),
    // Super admin should not see Profile; only login history
    { href: '/login-history', label: t('nav.loginHistory') },
    ...(!isSuperAdmin ? [{ href: '/profile', label: t('nav.profile') }] : []),
  ];

  const linkClass = (path) =>
    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
      router.pathname === path
        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors" data-lang={language}>
      <nav
        ref={navRef}
        className="bg-white/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-800/80 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-12 sm:h-14 md:h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 flex-1 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-2 sm:gap-2.5 md:gap-3 px-1.5 py-1.5 sm:py-2 flex-shrink-0 hover:opacity-80 transition-opacity">
                <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md sm:shadow-lg shadow-blue-600/20">
                  <img
                    src="/mandal-logo.svg"
                    alt="Mandal-Book Logo"
                    className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7"
                    aria-hidden="true"
                    loading="lazy"
                  />
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm sm:text-sm md:text-base lg:text-lg font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">Mandal-Book</span>
                  <span className="text-[10px] sm:text-[11px] md:text-xs uppercase tracking-wider sm:tracking-widest text-slate-500 dark:text-slate-400">
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
                 {(isAdmin || isSuperAdmin) && (
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

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 sm:px-4 pb-3 sm:pb-4 pt-2 sm:pt-3 space-y-2 sm:space-y-3 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {/* User Info */}
            <div className="flex flex-col min-w-0 pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</span>
            </div>

            {/* Mobile Navigation Links */}
            <div className="flex flex-col space-y-0.5 sm:space-y-1">
               {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-2 sm:py-2.5 px-2 sm:px-3 text-sm font-medium rounded-lg transition-colors ${
                    router.pathname === link.href
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
               {(isAdmin || isSuperAdmin) && (
                <Link
                  href="/admin"
                  className={`py-2 sm:py-2.5 px-2 sm:px-3 text-sm font-medium rounded-lg transition-colors ${
                    router.pathname === '/admin'
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t('nav.admin')}
                </Link>
              )}
            </div>

            {/* Theme Toggle - Mobile */}
            <button
              onClick={toggleTheme}
              className="w-full py-2 sm:py-2.5 px-2 sm:px-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-3"
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

            {/* Language Selector - Mobile */}
            <div className="px-2 sm:px-3 py-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide px-2">
                Language
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                    language === 'en'
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => changeLanguage('gu')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                    language === 'gu'
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  ગુજરાતી
                </button>
              </div>
            </div>

            {/* Logout Button - Mobile */}
            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              className="w-full py-2 sm:py-2.5 px-2 sm:px-3 text-left text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-3"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto py-6 sm:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="absolute inset-0 -z-10 opacity-60 dark:opacity-40" aria-hidden="true">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-br from-blue-50 via-indigo-50 to-transparent dark:from-blue-900/20 dark:via-indigo-900/20 blur-3xl" />
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
    </div>
  );
}

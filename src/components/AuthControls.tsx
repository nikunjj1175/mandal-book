"use client";
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Menu, X, User, Settings, LogOut, Home } from 'lucide-react';

export default function AuthControls() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link 
          href="/signin" 
          className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-500 transition-all duration-200"
        >
          Sign in
        </Link>
        <Link 
          href="/signup" 
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const isAdmin = (session.user as any)?.role === 'admin';

  return (
    <div className="relative">
      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-3">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-500 transition-all duration-200"
        >
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Link>
        {isAdmin && (
          <Link 
            href="/admin" 
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Settings className="h-4 w-4 mr-2" />
            Admin
          </Link>
        )}
        <Link 
          href="/profile" 
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-green-500 transition-all duration-200"
        >
          <User className="h-4 w-4 mr-2" />
          Profile
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-red-50 hover:border-red-500 hover:text-red-700 transition-all duration-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </button>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-slide-in-down">
            <Link 
              href="/dashboard" 
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="h-4 w-4 mr-3" />
              Dashboard
            </Link>
            {isAdmin && (
              <Link 
                href="/admin" 
                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="h-4 w-4 mr-3" />
                Admin
              </Link>
            )}
            <Link 
              href="/profile" 
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="h-4 w-4 mr-3" />
              Profile
            </Link>
            <hr className="my-2 border-gray-200" />
            <button
              onClick={() => {
                signOut({ callbackUrl: '/' });
                setIsMenuOpen(false);
              }}
              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Log out
            </button>
          </div>
        )}
      </div>

      {/* Backdrop for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}
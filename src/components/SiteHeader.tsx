import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import AuthControls from './AuthControls';
import AdminNotifications from './AdminNotifications';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            <div className="relative rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-2">
              <span className="text-white text-lg font-bold">📚</span>
            </div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent sm:text-2xl">
            Mandal Book
          </span>
        </Link>
        
        <div className="flex items-center gap-3 sm:gap-4">
          <AdminNotifications />
          <ThemeToggle />
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
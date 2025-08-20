import './globals.css';
import { Providers } from '@/components/Providers';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import NotificationSystem from '@/components/NotificationSystem';
import AdminChatbot from '@/components/AdminChatbot';
import { ToastProvider } from '@/components/ToastProvider';

export const metadata = {
  title: 'Mandal Book',
  description: 'Group savings & ledger'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Providers>
          {/* Decorative animated blobs */}
          <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="animate-blob animation-delay-2000 absolute -top-24 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-pink-400/20 via-sky-400/20 to-emerald-400/20 dark:from-pink-400/10 dark:via-sky-400/10 dark:to-emerald-400/10 blur-3xl" />
            <div className="animate-blob animation-delay-4000 absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-gradient-to-tr from-violet-400/20 via-fuchsia-400/20 to-amber-400/20 dark:from-violet-400/10 dark:via-fuchsia-400/10 dark:to-amber-400/10 blur-3xl" />
            <div className="animate-blob animation-delay-6000 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-400/15 via-purple-400/15 to-pink-400/15 dark:from-blue-400/8 dark:via-purple-400/8 dark:to-pink-400/8 blur-3xl" />
          </div>

          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </main>
            <SiteFooter />
          </div>
          
          <NotificationSystem />
          <AdminChatbot />
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}



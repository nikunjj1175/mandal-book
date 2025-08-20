import './globals.css';
import { Providers } from '@/components/Providers';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata = {
  title: 'Mandal Book',
  description: 'Group savings & ledger'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {/* Decorative animated blobs */}
          <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="animate-blob animation-delay-2000 absolute -top-24 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-pink-400/30 via-sky-400/30 to-emerald-400/30 blur-3xl" />
            <div className="animate-blob animation-delay-4000 absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-gradient-to-tr from-violet-400/30 via-fuchsia-400/30 to-amber-400/30 blur-3xl" />
          </div>

          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}



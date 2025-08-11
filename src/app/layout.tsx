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
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}



"use client";
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

type Props = { children: ReactNode };

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
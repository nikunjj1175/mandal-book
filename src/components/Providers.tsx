"use client";
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import SocketProvider from './SocketProvider';

type Props = { children: ReactNode };

export function Providers({ children }: Props) {
  return (
    <Provider store={store}>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SocketProvider>
            {children}
          </SocketProvider>
        </ThemeProvider>
      </SessionProvider>
    </Provider>
  );
}
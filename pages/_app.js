import '@/styles/globals.css';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Mandal-Book | Group Money Management System</title>
        <meta
          name="description"
          content="Mandal-Book helps groups manage monthly savings, KYC, UPI slips, loans, and approvals with a secure workflow."
        />
        <meta name="theme-color" content="#0f172a" />
        <meta property="og:site_name" content="Mandal-Book" />
        <meta property="og:title" content="Mandal-Book | Group Money Management System" />
        <meta
          property="og:description"
          content="Single window for KYC, UPI payment slips, auto OCR, and admin-controlled approvals."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mandal-book.app" />
        <link rel="icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <ErrorBoundary>
        <Provider store={store}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <Component {...pageProps} />
                <Toaster
                  position="top-center"
                  reverseOrder={false}
                  gutter={12}
                  containerClassName="toast-container"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#ffffff',
                      color: '#1f2937',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      border: '1px solid #e5e7eb',
                      maxWidth: '500px',
                      minWidth: '320px',
                      lineHeight: '1.5',
                    },
                    success: {
                      duration: 4000,
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#ffffff',
                      },
                      style: {
                        background: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #86efac',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#ffffff',
                      },
                      style: {
                        background: '#fef2f2',
                        color: '#991b1b',
                        border: '1px solid #fca5a5',
                      },
                    },
                    loading: {
                      iconTheme: {
                        primary: '#3b82f6',
                        secondary: '#ffffff',
                      },
                      style: {
                        background: '#eff6ff',
                        color: '#1e40af',
                        border: '1px solid #93c5fd',
                      },
                    },
                  }}
                />
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </Provider>
      </ErrorBoundary>
    </>
  );
}

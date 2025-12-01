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
        <link rel="icon" href="/mandal-logo.svg" />
        <link rel="apple-touch-icon" href="/mandal-logo.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const initialTheme = theme || systemTheme;
                  if (initialTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </Head>
      <ErrorBoundary>
        <Provider store={store}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <Component {...pageProps} />
                <Toaster position="top-right" />
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </Provider>
      </ErrorBoundary>
    </>
  );
}


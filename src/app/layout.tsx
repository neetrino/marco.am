import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { TidioDynamicLoader } from '../components/TidioDynamicLoader';
import { ClientProviders } from '../components/ClientProviders';
import { AppChrome } from '../components/AppChrome';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '../lib/language';
import { LanguagePreferenceProvider } from '../lib/language-context';

const inter = Inter({ subsets: ['latin'], display: 'swap', adjustFontFallback: true });

export const metadata: Metadata = {
  title: 'Marco Group',
  description: 'Կահույքի և տեխնիկայի հուսալի մատակարար',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLanguage: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  return (
    <html lang={initialLanguage} className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full bg-[var(--app-bg)] text-[var(--app-text)] antialiased transition-colors duration-200`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (() => {
              try {
                const storageKey = 'marco-theme';
                const stored = localStorage.getItem(storageKey);
                const theme =
                  stored === 'light' || stored === 'dark' ? stored : 'light';
                const root = document.documentElement;
                root.classList.toggle('dark', theme === 'dark');
                root.dataset.theme = theme;
                root.style.colorScheme = theme;
              } catch {}
            })();
          `}
        </Script>
        <TidioDynamicLoader />
        <Suspense fallback={null}>
          <LanguagePreferenceProvider initialLanguage={initialLanguage}>
            <ClientProviders>
              <AppChrome initialLanguage={initialLanguage}>{children}</AppChrome>
            </ClientProviders>
          </LanguagePreferenceProvider>
        </Suspense>
      </body>
    </html>
  );
}


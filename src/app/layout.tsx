import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { MOBILE_NAV_LAYOUT_PADDING_BOTTOM } from '../components/mobile-bottom-nav.constants';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '../lib/language';
import { LanguagePreferenceProvider } from '../lib/language-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shop - Marco Group',
  description: 'Modern e-commerce platform',
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
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = stored === 'light' || stored === 'dark'
                  ? stored
                  : (systemDark ? 'dark' : 'light');
                const root = document.documentElement;
                root.classList.toggle('dark', theme === 'dark');
                root.dataset.theme = theme;
                root.style.colorScheme = theme;
              } catch {}
            })();
          `}
        </Script>
        <Script
          src="https://code.tidio.co/9ovkfmgncuyhg4kaemwvkdbvp5r7njec.js"
          strategy="lazyOnload"
        />
        <Suspense fallback={null}>
          <LanguagePreferenceProvider initialLanguage={initialLanguage}>
            <ClientProviders>
              <div
                className="flex min-h-screen flex-col bg-[var(--app-bg)] max-lg:[padding-bottom:var(--mobile-nav-pb)] lg:pb-0"
                style={
                  {
                    ['--mobile-nav-pb' as string]: MOBILE_NAV_LAYOUT_PADDING_BOTTOM,
                  } as React.CSSProperties
                }
              >
                <Header initialLanguage={initialLanguage} />
                <main className="flex-1 w-full bg-[var(--app-bg)]">
                  {children}
                </main>
                <div className="hidden md:block">
                  <Footer />
                </div>
                <MobileBottomNav />
              </div>
            </ClientProviders>
          </LanguagePreferenceProvider>
        </Suspense>
      </body>
    </html>
  );
}


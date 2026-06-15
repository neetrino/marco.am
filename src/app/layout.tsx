import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Script from 'next/script';
import './globals.css';
import { TidioDynamicLoader } from '../components/TidioDynamicLoader';
import { ClientProviders } from '../components/ClientProviders';
import { AppChrome } from '../components/AppChrome';
import { appBodyFontClassName, appHtmlFontClassName } from '@/fonts/app-fonts';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '../lib/language';
import { LanguagePreferenceProvider } from '../lib/language-context';
import { t } from '../lib/i18n';
import { APP_VIEWPORT } from '../constants/viewport';

export const viewport = APP_VIEWPORT;

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  return {
    title: t(lang, 'common.meta.title'),
    description: t(lang, 'common.meta.description'),
    icons: {
      icon: '/assets/brand/marco-group-logo.webp',
      shortcut: '/assets/brand/marco-group-logo.webp',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLanguage: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  return (
    <html lang={initialLanguage} className={`h-full ${appHtmlFontClassName}`} suppressHydrationWarning>
      <body className={`${appBodyFontClassName} min-h-full bg-[var(--app-bg)] text-[var(--app-text)] antialiased transition-colors duration-200`}>
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


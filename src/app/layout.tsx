import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { appBodyFontClassName, appHtmlFontClassName } from '@/fonts/app-fonts';
import { DEFAULT_STOREFRONT_LANGUAGE } from '../lib/language';
import '../lib/i18n/register-admin-server';
import { t } from '../lib/i18n';
import { APP_VIEWPORT } from '../constants/viewport';
import { SITE_LOGO_SRC } from '@/lib/constants/site-brand';

export const viewport = APP_VIEWPORT;

export function generateMetadata(): Metadata {
  const lang = DEFAULT_STOREFRONT_LANGUAGE;

  return {
    title: t(lang, 'common.meta.title'),
    description: t(lang, 'common.meta.description'),
    icons: {
      icon: SITE_LOGO_SRC,
      shortcut: SITE_LOGO_SRC,
    },
  };
}

/**
 * Minimal root shell (html/body/fonts/theme/lang). Storefront chrome lives in `(storefront)/layout`.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLanguage = DEFAULT_STOREFRONT_LANGUAGE;

  return (
    <html lang={initialLanguage} className={`h-full ${appHtmlFontClassName}`} suppressHydrationWarning>
      <body className={`${appBodyFontClassName} min-h-full bg-[var(--app-bg)] text-[var(--app-text)] antialiased transition-colors duration-200`}>
        <Script id="lang-init" strategy="beforeInteractive">
          {`
            (() => {
              try {
                const match = document.cookie.match(/(?:^|; )shop_language=([^;]+)/);
                const raw = match ? decodeURIComponent(match[1]) : null;
                const allowed = { en: 1, hy: 1, ru: 1, ka: 1 };
                if (raw && allowed[raw]) {
                  document.documentElement.lang = raw === 'ka' ? 'en' : raw;
                }
              } catch {}
            })();
          `}
        </Script>
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}

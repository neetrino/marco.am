import type { ReactNode } from 'react';
import { Suspense } from 'react';
import Script from 'next/script';

import { ClientProviders } from '@/components/ClientProviders';
import { DEFAULT_STOREFRONT_LANGUAGE } from '@/lib/language';
import { LanguagePreferenceProvider } from '@/lib/language-context';
import { serializeClientI18nSeed } from '@/lib/i18n/server-storefront-language-payload';
import { AdminLayoutClient } from './AdminLayoutClient';

/**
 * Admin segment providers (auth/theme/query). Intentionally no storefront AppChrome/Header.
 */
export default function SupersudoLayout({ children }: { children: ReactNode }) {
  const initialLanguage = DEFAULT_STOREFRONT_LANGUAGE;
  const i18nSeed = serializeClientI18nSeed(initialLanguage);

  return (
    <>
      <Script id="admin-i18n-init" strategy="beforeInteractive">
        {`window.__MARCO_I18N__=${i18nSeed};`}
      </Script>
      <Suspense fallback={null}>
        <LanguagePreferenceProvider initialLanguage={initialLanguage}>
          <ClientProviders>
            <AdminLayoutClient>{children}</AdminLayoutClient>
          </ClientProviders>
        </LanguagePreferenceProvider>
      </Suspense>
    </>
  );
}

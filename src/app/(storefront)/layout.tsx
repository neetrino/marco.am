import React, { Suspense } from 'react';
import Script from 'next/script';
import { TidioDynamicLoader } from '../../components/TidioDynamicLoader';
import { ClientProviders } from '../../components/ClientProviders';
import { AppChrome } from '../../components/AppChrome';
import { DEFAULT_STOREFRONT_LANGUAGE } from '../../lib/language';
import { LanguagePreferenceProvider } from '../../lib/language-context';
import { serializeClientI18nSeed } from '../../lib/i18n/server-storefront-language-payload';

/**
 * Storefront chrome + client providers.
 * Kept out of the root layout so unknown URLs (root `not-found`) skip Header/API fan-out.
 */
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLanguage = DEFAULT_STOREFRONT_LANGUAGE;
  const i18nSeed = serializeClientI18nSeed(initialLanguage);

  return (
    <>
      <Script id="i18n-init" strategy="beforeInteractive">
        {`window.__MARCO_I18N__=${i18nSeed};`}
      </Script>
      <TidioDynamicLoader />
      <Suspense fallback={null}>
        <LanguagePreferenceProvider initialLanguage={initialLanguage}>
          <ClientProviders>
            <AppChrome initialLanguage={initialLanguage}>{children}</AppChrome>
          </ClientProviders>
        </LanguagePreferenceProvider>
      </Suspense>
    </>
  );
}

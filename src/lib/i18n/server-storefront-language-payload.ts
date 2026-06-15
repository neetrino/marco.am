import type { LanguageCode } from '../language';

import { enStorefrontNamespaces } from './languages/en';
import { hyStorefrontNamespaces } from './languages/hy';
import { ruStorefrontNamespaces } from './languages/ru';
import type { StorefrontNamespacesPayload } from './languages/en';

const STOREFRONT_LANGUAGE_PAYLOADS = {
  en: enStorefrontNamespaces,
  hy: hyStorefrontNamespaces,
  ru: ruStorefrontNamespaces,
} as const satisfies Record<'en' | 'hy' | 'ru', StorefrontNamespacesPayload>;

export type ClientI18nSeed = {
  lang: LanguageCode;
  namespaces: StorefrontNamespacesPayload;
};

export function getStorefrontLanguagePayload(lang: LanguageCode): StorefrontNamespacesPayload {
  if (lang in STOREFRONT_LANGUAGE_PAYLOADS) {
    return STOREFRONT_LANGUAGE_PAYLOADS[lang as keyof typeof STOREFRONT_LANGUAGE_PAYLOADS];
  }
  return STOREFRONT_LANGUAGE_PAYLOADS.en;
}

/** Safe JSON for a beforeInteractive inline script (hydration seed, one language only). */
export function serializeClientI18nSeed(lang: LanguageCode): string {
  const seed: ClientI18nSeed = {
    lang,
    namespaces: getStorefrontLanguagePayload(lang),
  };
  return JSON.stringify(seed).replace(/</g, '\\u003c');
}

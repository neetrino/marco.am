import type { LanguageCode } from '../language';

import type { StorefrontNamespacesPayload } from './languages/en';
import {
  isStorefrontLanguageLoaded,
  registerStorefrontLanguage,
} from './translation-store';

const inflight = new Map<LanguageCode, Promise<void>>();

async function importStorefrontLanguage(
  lang: LanguageCode,
): Promise<StorefrontNamespacesPayload> {
  switch (lang) {
    case 'en': {
      const mod = await import('./languages/en');
      return mod.enStorefrontNamespaces;
    }
    case 'hy': {
      const mod = await import('./languages/hy');
      return mod.hyStorefrontNamespaces;
    }
    case 'ru': {
      const mod = await import('./languages/ru');
      return mod.ruStorefrontNamespaces;
    }
    default: {
      const mod = await import('./languages/en');
      return mod.enStorefrontNamespaces;
    }
  }
}

/** Loads one storefront language chunk on demand (language switcher / fallback). */
export function ensureStorefrontLanguageLoaded(lang: LanguageCode): Promise<void> {
  if (isStorefrontLanguageLoaded(lang)) {
    return Promise.resolve();
  }

  const existing = inflight.get(lang);
  if (existing) {
    return existing;
  }

  const promise = importStorefrontLanguage(lang)
    .then((namespaces) => {
      registerStorefrontLanguage(lang, namespaces);
    })
    .finally(() => {
      inflight.delete(lang);
    });

  inflight.set(lang, promise);
  return promise;
}

/** Preloads English fallback during idle time when the active locale is not English. */
export function preloadEnglishFallbackLanguage(): void {
  if (isStorefrontLanguageLoaded('en')) {
    return;
  }
  void ensureStorefrontLanguageLoaded('en');
}

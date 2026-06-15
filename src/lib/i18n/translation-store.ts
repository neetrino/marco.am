import type { LanguageCode } from '../language';
import type { Namespace, StorefrontNamespace, TranslationStore } from './types';
import type { StorefrontNamespacesPayload } from './languages/en';

const translations: TranslationStore = {};
const loadedStorefrontLanguages = new Set<LanguageCode>();
let adminRegistered = false;

export function isStorefrontLanguageLoaded(lang: LanguageCode): boolean {
  return loadedStorefrontLanguages.has(lang);
}

/** Merges one language's storefront namespaces into the in-memory store. */
export function registerStorefrontLanguage(
  lang: LanguageCode,
  namespaces: StorefrontNamespacesPayload,
): void {
  translations[lang] = {
    ...(translations[lang] ?? {}),
    ...namespaces,
  };
  loadedStorefrontLanguages.add(lang);
}

/** Merges admin locale JSON into the in-memory store (`/supersudo` client + server bootstrap). */
export function registerAdminTranslations(store: TranslationStore): void {
  if (adminRegistered) {
    return;
  }
  for (const lang of Object.keys(store) as LanguageCode[]) {
    const adminNamespace = store[lang]?.admin;
    if (!adminNamespace) {
      continue;
    }
    translations[lang] = {
      ...(translations[lang] ?? {}),
      admin: adminNamespace,
    };
  }
  adminRegistered = true;
}

export function loadTranslation(lang: LanguageCode, namespace: Namespace): unknown {
  try {
    return translations[lang]?.[namespace] ?? null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Failed to load translation: ${lang}/${namespace}`, error);
    }
    return null;
  }
}

export function getNestedValue(obj: unknown, keys: string[]): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (
      current !== null &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      key in current
    ) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }
  return current;
}

export type { StorefrontNamespace, StorefrontNamespacesPayload };

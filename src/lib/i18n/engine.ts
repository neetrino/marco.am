import './register-storefront-server';
import { getStoredLanguage, type LanguageCode } from '../language';
import {
  ALL_NAMESPACES_SET,
  STOREFRONT_NAMESPACES,
  type Namespace,
  type ProductField,
} from './types';
import {
  getCachedAttributeLabel,
  getCachedTranslation,
  setCachedAttributeLabel,
  setCachedTranslation,
  SKIP_I18N_RESULT_CACHE,
} from './translation-cache';
import {
  getNestedValue,
  loadTranslation,
  registerAdminTranslations,
  registerStorefrontLanguage,
} from './translation-store';
import type { StorefrontNamespacesPayload } from './languages/en';

type ClientI18nWindow = Window & {
  __MARCO_I18N__?: {
    lang: LanguageCode;
    namespaces: StorefrontNamespacesPayload;
  };
};

function applyClientI18nBootstrap(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const seed = (window as ClientI18nWindow).__MARCO_I18N__;
  if (!seed?.lang || !seed.namespaces) {
    return;
  }
  registerStorefrontLanguage(seed.lang, seed.namespaces);
  delete (window as ClientI18nWindow).__MARCO_I18N__;
}

applyClientI18nBootstrap();

export {
  registerAdminTranslations,
  registerStorefrontLanguage,
  loadTranslation,
} from './translation-store';

export { clearTranslationCache } from './translation-cache';
export { ensureStorefrontLanguageLoaded, preloadEnglishFallbackLanguage } from './load-storefront-language';

export function t(lang: LanguageCode | undefined, path: string): string {
  if (!path || typeof path !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid path parameter: ${path}. Expected a string.`);
    }
    return typeof path === 'string' ? path : '';
  }

  if (!lang) {
    lang = getStoredLanguage();
  }

  const parts = path.split('.');
  if (parts.length < 2) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid translation path: "${path}". Expected format: "namespace.key"`);
    }
    return path;
  }

  const namespace = parts[0] as Namespace;
  const keys = parts.slice(1);

  const cacheKey = `${lang}:${path}`;
  if (!SKIP_I18N_RESULT_CACHE) {
    const cached = getCachedTranslation(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
  }

  if (!ALL_NAMESPACES_SET.has(namespace)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[i18n] Invalid namespace: "${namespace}". Valid namespaces: ${[...ALL_NAMESPACES_SET].join(', ')}`,
      );
    }
    return path;
  }

  let translationObj = loadTranslation(lang, namespace);

  if (!translationObj && lang !== 'en') {
    translationObj = loadTranslation('en', namespace);
  }

  if (!translationObj) {
    return path;
  }

  let value = getNestedValue(translationObj, keys);

  if (value === null && lang !== 'en') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Missing translation: ${lang}/${path}`);
      return `[missing:${lang}/${path}]`;
    }
    const enTranslationObj = loadTranslation('en', namespace);
    if (enTranslationObj) {
      value = getNestedValue(enTranslationObj, keys);
    }
  }

  if (value === null || value === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Missing translation: ${lang}/${path}`);
      return `[missing:${lang}/${path}]`;
    }
    return path;
  }

  if (Array.isArray(value)) {
    return value as unknown as string;
  }

  const result = typeof value === 'string' ? value : path;
  setCachedTranslation(cacheKey, result);
  return result;
}

export { getProductText, getAttributeLabel } from './engine-lookups';

export function getAvailableNamespaces(): Namespace[] {
  return [...STOREFRONT_NAMESPACES];
}

export function getAvailableLanguages(): LanguageCode[] {
  return ['en', 'hy', 'ru'] as LanguageCode[];
}

export type { Namespace, ProductField, StorefrontNamespace } from './types';

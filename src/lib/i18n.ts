/**
 * i18n helper functions according to plan.md and structure.md
 * Server-side translation functions (can be used in Server Components)
 * For client-side React hooks, see i18n-client.ts
 *
 * Storefront strings only — admin JSON is registered on the server at module init
 * and synchronously when `/supersudo` client layout loads.
 */

export {
  clearTranslationCache,
  ensureStorefrontLanguageLoaded,
  getAttributeLabel,
  getAvailableLanguages,
  getAvailableNamespaces,
  getProductText,
  loadTranslation,
  preloadEnglishFallbackLanguage,
  registerAdminTranslations,
  t,
} from './i18n/engine';

export type { Namespace, ProductField, StorefrontNamespace } from './i18n/types';

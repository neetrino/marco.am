/**
 * Storefront i18n entry — no admin locale JSON in the client bundle.
 * Server code may import `@/lib/i18n` which re-exports this module.
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
} from './engine';

export type { Namespace, ProductField, StorefrontNamespace } from './engine';

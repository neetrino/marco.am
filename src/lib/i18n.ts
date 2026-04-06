/**
 * i18n helper functions according to plan.md and structure.md
 * Server-side translation functions (can be used in Server Components)
 * For client-side React hooks, see i18n-client.ts
 */

import { type LanguageCode } from './language';
import { getStoredLanguage } from './language';

// Pre-load all translations at build time for optimal performance
import enCommon from '../locales/en/common.json';
import enHome from '../locales/en/home.json';
import enProduct from '../locales/en/product.json';
import enProducts from '../locales/en/products.json';
import enAttributes from '../locales/en/attributes.json';
import enDelivery from '../locales/en/delivery.json';
import enAbout from '../locales/en/about.json';
import enContact from '../locales/en/contact.json';
import enFaq from '../locales/en/faq.json';
import enLogin from '../locales/en/login.json';
import enCookies from '../locales/en/cookies.json';
import enDeliveryTerms from '../locales/en/delivery-terms.json';
import enTerms from '../locales/en/terms.json';
import enPrivacy from '../locales/en/privacy.json';
import enSupport from '../locales/en/support.json';
import enStores from '../locales/en/stores.json';
import enReturns from '../locales/en/returns.json';
import enRefundPolicy from '../locales/en/refund-policy.json';
import enProfile from '../locales/en/profile.json';
import enCheckout from '../locales/en/checkout.json';
import enRegister from '../locales/en/register.json';
import enCategories from '../locales/en/categories.json';
import enOrders from '../locales/en/orders.json';
import enAdmin from '../locales/en/admin.json';

import hyCommon from '../locales/hy/common.json';
import hyHome from '../locales/hy/home.json';
import hyProduct from '../locales/hy/product.json';
import hyProducts from '../locales/hy/products.json';
import hyAttributes from '../locales/hy/attributes.json';
import hyDelivery from '../locales/hy/delivery.json';
import hyAbout from '../locales/hy/about.json';
import hyContact from '../locales/hy/contact.json';
import hyFaq from '../locales/hy/faq.json';
import hyLogin from '../locales/hy/login.json';
import hyCookies from '../locales/hy/cookies.json';
import hyDeliveryTerms from '../locales/hy/delivery-terms.json';
import hyTerms from '../locales/hy/terms.json';
import hyPrivacy from '../locales/hy/privacy.json';
import hySupport from '../locales/hy/support.json';
import hyStores from '../locales/hy/stores.json';
import hyReturns from '../locales/hy/returns.json';
import hyRefundPolicy from '../locales/hy/refund-policy.json';
import hyProfile from '../locales/hy/profile.json';
import hyCheckout from '../locales/hy/checkout.json';
import hyRegister from '../locales/hy/register.json';
import hyCategories from '../locales/hy/categories.json';
import hyOrders from '../locales/hy/orders.json';
import hyAdmin from '../locales/hy/admin.json';

import ruCommon from '../locales/ru/common.json';
import ruHome from '../locales/ru/home.json';
import ruProduct from '../locales/ru/product.json';
import ruProducts from '../locales/ru/products.json';
import ruAttributes from '../locales/ru/attributes.json';
import ruDelivery from '../locales/ru/delivery.json';
import ruAbout from '../locales/ru/about.json';
import ruContact from '../locales/ru/contact.json';
import ruFaq from '../locales/ru/faq.json';
import ruLogin from '../locales/ru/login.json';
import ruCookies from '../locales/ru/cookies.json';
import ruDeliveryTerms from '../locales/ru/delivery-terms.json';
import ruTerms from '../locales/ru/terms.json';
import ruPrivacy from '../locales/ru/privacy.json';
import ruSupport from '../locales/ru/support.json';
import ruStores from '../locales/ru/stores.json';
import ruReturns from '../locales/ru/returns.json';
import ruRefundPolicy from '../locales/ru/refund-policy.json';
import ruProfile from '../locales/ru/profile.json';
import ruCheckout from '../locales/ru/checkout.json';
import ruRegister from '../locales/ru/register.json';
import ruCategories from '../locales/ru/categories.json';
import ruOrders from '../locales/ru/orders.json';
import ruAdmin from '../locales/ru/admin.json';

// Type definitions for better type safety
export type Namespace = 'common' | 'home' | 'product' | 'products' | 'attributes' | 'delivery' | 'about' | 'contact' | 'faq' | 'login' | 'cookies' | 'delivery-terms' | 'terms' | 'privacy' | 'support' | 'stores' | 'returns' | 'refund-policy' | 'profile' | 'checkout' | 'register' | 'categories' | 'orders' | 'admin';
export type ProductField = 'title' | 'shortDescription' | 'longDescription';

// Translation store - organized by language and namespace
// Supports en, hy, and ru languages
const translations: Partial<Record<LanguageCode, Record<Namespace, unknown>>> = {
  en: {
    common: enCommon,
    home: enHome,
    product: enProduct,
    products: enProducts,
    attributes: enAttributes,
    delivery: enDelivery,
    about: enAbout,
    contact: enContact,
    faq: enFaq,
    login: enLogin,
    cookies: enCookies,
    'delivery-terms': enDeliveryTerms,
    terms: enTerms,
    privacy: enPrivacy,
    support: enSupport,
    stores: enStores,
    returns: enReturns,
    'refund-policy': enRefundPolicy,
    profile: enProfile,
    checkout: enCheckout,
    register: enRegister,
    categories: enCategories,
    orders: enOrders,
    admin: enAdmin,
  },
  hy: {
    common: hyCommon,
    home: hyHome,
    product: hyProduct,
    products: hyProducts,
    attributes: hyAttributes,
    delivery: hyDelivery,
    about: hyAbout,
    contact: hyContact,
    faq: hyFaq,
    login: hyLogin,
    cookies: hyCookies,
    'delivery-terms': hyDeliveryTerms,
    terms: hyTerms,
    privacy: hyPrivacy,
    support: hySupport,
    stores: hyStores,
    returns: hyReturns,
    'refund-policy': hyRefundPolicy,
    profile: hyProfile,
    checkout: hyCheckout,
    register: hyRegister,
    categories: hyCategories,
    orders: hyOrders,
    admin: hyAdmin,
  },
  ru: {
    common: ruCommon,
    home: ruHome,
    product: ruProduct,
    products: ruProducts,
    attributes: ruAttributes,
    delivery: ruDelivery,
    about: ruAbout,
    contact: ruContact,
    faq: ruFaq,
    login: ruLogin,
    cookies: ruCookies,
    'delivery-terms': ruDeliveryTerms,
    terms: ruTerms,
    privacy: ruPrivacy,
    support: ruSupport,
    stores: ruStores,
    returns: ruReturns,
    'refund-policy': ruRefundPolicy,
    profile: ruProfile,
    checkout: ruCheckout,
    register: ruRegister,
    categories: ruCategories,
    orders: ruOrders,
    admin: ruAdmin,
  },
};

// Cache for resolved translation paths (performance optimization)
const translationCache = new Map<string, string>();

/**
 * Get nested value from object by path array
 * @param obj - Object to traverse
 * @param keys - Array of keys to navigate
 * @returns The value at the path or null
 */
function getNestedValue(obj: unknown, keys: string[]): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (
      current !== null &&
      typeof current === "object" &&
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

/**
 * Load a translation namespace for a given language
 * @param lang - Language code
 * @param namespace - Namespace name
 * @returns Translation object or null
 */
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

/**
 * Translation function: t(lang, path)
 * Path format: "namespace.key" (e.g., "common.buttons.addToCart")
 * 
 * Features:
 * - Automatic fallback to English
 * - Path caching for performance
 * - Type-safe namespace validation
 * 
 * @param lang - Language code (optional, uses stored language if not provided)
 * @param path - Translation path in format "namespace.key.subkey"
 * @returns Translated string or the path if translation not found
 */
export function t(lang: LanguageCode | undefined, path: string): string {
  // Validate path parameter
  if (!path || typeof path !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid path parameter: ${path}. Expected a string.`);
    }
    return typeof path === 'string' ? path : '';
  }

  // Use stored language if not provided
  if (!lang) {
    lang = getStoredLanguage();
  }

  // Validate path format
  const parts = path.split('.');
  if (parts.length < 2) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid translation path: "${path}". Expected format: "namespace.key"`);
    }
    return path;
  }

  const namespace = parts[0] as Namespace;
  const keys = parts.slice(1);

  // Check cache first (performance optimization)
  const cacheKey = `${lang}:${path}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Validate namespace
  const validNamespaces: Namespace[] = ['common', 'home', 'product', 'products', 'attributes', 'delivery', 'about', 'contact', 'faq', 'login', 'cookies', 'delivery-terms', 'terms', 'privacy', 'support', 'stores', 'returns', 'refund-policy', 'profile', 'checkout', 'register', 'categories', 'orders', 'admin'];
  if (!validNamespaces.includes(namespace)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid namespace: "${namespace}". Valid namespaces: ${validNamespaces.join(', ')}`);
    }
    return path;
  }

  // Try to load translation for the requested language
  let translationObj = loadTranslation(lang, namespace);
  
  // Fallback to English if translation not found
  if (!translationObj && lang !== 'en') {
    translationObj = loadTranslation('en', namespace);
  }

  if (!translationObj) {
    return path;
  }

  // Navigate through nested keys
  let value = getNestedValue(translationObj, keys);

  // If value not found in requested language, try English fallback
  if (value === null && lang !== 'en') {
    const enTranslationObj = loadTranslation('en', namespace);
    if (enTranslationObj) {
      value = getNestedValue(enTranslationObj, keys);
    }
  }

  // Return result - can be string or array
  if (value === null || value === undefined) {
    return path;
  }
  
  // For arrays, return as-is (don't cache) — callers historically treated as string; narrow at call sites if needed
  if (Array.isArray(value)) {
    return value as unknown as string;
  }
  
  const result = typeof value === 'string' ? value : path;
  
  // Cache the result (limit cache size to prevent memory issues)
  if (translationCache.size < 1000) {
    translationCache.set(cacheKey, result);
  }
  
  return result;
}

/**
 * Get product text: getProductText(lang, productId, field)
 * Reads from products.json for the given language
 * 
 * Features:
 * - Automatic fallback to English
 * - Type-safe field validation
 * - Empty string fallback
 * 
 * @param lang - Language code (optional, uses stored language if not provided)
 * @param productId - Product ID (string)
 * @param field - Field name: 'title', 'shortDescription', or 'longDescription'
 * @returns Product text or empty string if not found
 */
export function getProductText(
  lang: LanguageCode | undefined,
  productId: string,
  field: ProductField
): string {
  // Use stored language if not provided
  if (!lang) {
    lang = getStoredLanguage();
  }

  // Validate productId
  if (!productId || typeof productId !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid productId: ${productId}`);
    }
    return '';
  }

  try {
    // Try to load products for the requested language
    let products = loadTranslation(lang, 'products');
    
    // Fallback to English if not found
    if ((!products || typeof products !== 'object') && lang !== 'en') {
      products = loadTranslation('en', 'products');
    }

    if (!products || typeof products !== 'object' || Array.isArray(products)) {
      return '';
    }

    const productsRecord = products as Record<string, unknown>;
    // Get product data
    const product = productsRecord[productId];
    if (!product || typeof product !== 'object') {
      // Try English fallback
      if (lang !== 'en') {
        const enProducts = loadTranslation('en', 'products');
        if (
          enProducts &&
          typeof enProducts === 'object' &&
          !Array.isArray(enProducts) &&
          productId in enProducts
        ) {
          const enProduct = (enProducts as Record<string, unknown>)[productId];
          if (enProduct && typeof enProduct === 'object' && field in enProduct) {
            const value = (enProduct as Record<string, unknown>)[field];
            return typeof value === 'string' ? value : '';
          }
        }
      }
      return '';
    }

    const productFields = product as Record<string, unknown>;
    // Get field value
    if (field in productFields) {
      const value = productFields[field];
      if (typeof value === 'string') {
        return value;
      }
    }

    // Fallback to English
    if (lang !== 'en') {
      const enProducts = loadTranslation('en', 'products');
      if (
        enProducts &&
        typeof enProducts === 'object' &&
        !Array.isArray(enProducts) &&
        productId in enProducts
      ) {
        const enProduct = (enProducts as Record<string, unknown>)[productId];
        if (enProduct && typeof enProduct === 'object' && field in enProduct) {
          const value = (enProduct as Record<string, unknown>)[field];
          return typeof value === 'string' ? value : '';
        }
      }
    }

    return '';
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Failed to get product text: ${lang}/${productId}/${field}`, error);
    }
    return '';
  }
}

/**
 * Get attribute label: getAttributeLabel(lang, type, value)
 * Reads from attributes.json for the given language
 * 
 * Features:
 * - Automatic fallback to English
 * - Returns original value if label not found (graceful degradation)
 * 
 * @param lang - Language code (optional, uses stored language if not provided)
 * @param type - Attribute type (e.g., 'color', 'size')
 * @param value - Attribute value code (e.g., 'red', 'xl')
 * @returns Translated label or the original value if not found
 */
export function getAttributeLabel(
  lang: LanguageCode | undefined,
  type: string,
  value: string
): string {
  // Use stored language if not provided
  if (!lang) {
    lang = getStoredLanguage();
  }

  // Validate inputs
  if (!type || !value || typeof type !== 'string' || typeof value !== 'string') {
    return value || '';
  }

  // Normalize value (lowercase for case-insensitive lookup)
  const normalizedValue = value.toLowerCase().trim();

  try {
    // Try to load attributes for the requested language
    let attributes = loadTranslation(lang, 'attributes');
    
    // Fallback to English if not found
    if ((!attributes || typeof attributes !== 'object') && lang !== 'en') {
      attributes = loadTranslation('en', 'attributes');
    }

    if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
      return value;
    }

    const attrs = attributes as Record<string, unknown>;
    // Get attribute type object
    if (type in attrs) {
      const typeObj = attrs[type];
      if (typeObj && typeof typeObj === 'object' && !Array.isArray(typeObj)) {
        const typeRecord = typeObj as Record<string, unknown>;
        // Try exact match first
        if (normalizedValue in typeRecord) {
          const label = typeRecord[normalizedValue];
          if (typeof label === 'string') {
            return label;
          }
        }
        // Try case-insensitive match
        for (const [key, label] of Object.entries(typeRecord)) {
          if (key.toLowerCase() === normalizedValue && typeof label === 'string') {
            return label;
          }
        }
      }
    }

    // Fallback to English
    if (lang !== 'en') {
      const enAttributes = loadTranslation('en', 'attributes');
      if (
        enAttributes &&
        typeof enAttributes === 'object' &&
        !Array.isArray(enAttributes) &&
        type in enAttributes
      ) {
        const enTypeObj = (enAttributes as Record<string, unknown>)[type];
        if (enTypeObj && typeof enTypeObj === 'object' && !Array.isArray(enTypeObj)) {
          const enRecord = enTypeObj as Record<string, unknown>;
          if (normalizedValue in enRecord) {
            const label = enRecord[normalizedValue];
            if (typeof label === 'string') {
              return label;
            }
          }
          // Try case-insensitive match
          for (const [key, label] of Object.entries(enRecord)) {
            if (key.toLowerCase() === normalizedValue && typeof label === 'string') {
              return label;
            }
          }
        }
      }
    }

    // Return original value if no translation found (graceful degradation)
    return value;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Failed to get attribute label: ${lang}/${type}/${value}`, error);
    }
    return value;
  }
}

// Note: useTranslation hook has been moved to i18n-client.ts
// Import it from './i18n-client' in Client Components

/**
 * Clear translation cache (useful for development/hot reload)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get all available namespaces
 */
export function getAvailableNamespaces(): Namespace[] {
  return ['common', 'home', 'product', 'products', 'attributes', 'delivery', 'about', 'contact', 'faq', 'login', 'cookies', 'delivery-terms', 'terms', 'privacy', 'support', 'stores', 'returns', 'refund-policy', 'profile', 'checkout', 'register', 'categories', 'orders'];
}

/**
 * Get all available languages (only languages with translations)
 */
export function getAvailableLanguages(): LanguageCode[] {
  return ['en', 'hy', 'ru'] as LanguageCode[];
}

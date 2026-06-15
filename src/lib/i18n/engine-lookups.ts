import { getStoredLanguage, type LanguageCode } from '../language';
import type { ProductField } from './types';
import {
  getCachedAttributeLabel,
  setCachedAttributeLabel,
  SKIP_I18N_RESULT_CACHE,
} from './translation-cache';
import { loadTranslation } from './translation-store';

function resolveAttributeLabelFromStore(
  attributes: Record<string, unknown>,
  type: string,
  normalizedValue: string,
): string | null {
  if (!(type in attributes)) {
    return null;
  }
  const typeObj = attributes[type];
  if (!typeObj || typeof typeObj !== 'object' || Array.isArray(typeObj)) {
    return null;
  }
  const typeRecord = typeObj as Record<string, unknown>;
  if (normalizedValue in typeRecord) {
    const label = typeRecord[normalizedValue];
    if (typeof label === 'string') {
      return label;
    }
  }
  for (const [key, label] of Object.entries(typeRecord)) {
    if (key.toLowerCase() === normalizedValue && typeof label === 'string') {
      return label;
    }
  }
  return null;
}

export function getProductText(
  lang: LanguageCode | undefined,
  productId: string,
  field: ProductField,
): string {
  if (!lang) {
    lang = getStoredLanguage();
  }

  if (!productId || typeof productId !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid productId: ${productId}`);
    }
    return '';
  }

  try {
    let products = loadTranslation(lang, 'products');

    if ((!products || typeof products !== 'object') && lang !== 'en') {
      products = loadTranslation('en', 'products');
    }

    if (!products || typeof products !== 'object' || Array.isArray(products)) {
      return '';
    }

    const productsRecord = products as Record<string, unknown>;
    const product = productsRecord[productId];
    if (!product || typeof product !== 'object') {
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
    if (field in productFields) {
      const value = productFields[field];
      if (typeof value === 'string') {
        return value;
      }
    }

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

export function getAttributeLabel(
  lang: LanguageCode | undefined,
  type: string,
  value: string,
): string {
  if (!lang) {
    lang = getStoredLanguage();
  }

  if (!type || !value || typeof type !== 'string' || typeof value !== 'string') {
    return value || '';
  }

  const normalizedValue = value.toLowerCase().trim();
  const cacheKey = `${lang}:${type}:${normalizedValue}`;

  if (!SKIP_I18N_RESULT_CACHE) {
    const cached = getCachedAttributeLabel(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
  }

  try {
    let attributes = loadTranslation(lang, 'attributes');

    if ((!attributes || typeof attributes !== 'object') && lang !== 'en') {
      attributes = loadTranslation('en', 'attributes');
    }

    if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
      return value;
    }

    const attrs = attributes as Record<string, unknown>;
    const primary = resolveAttributeLabelFromStore(attrs, type, normalizedValue);
    if (primary) {
      setCachedAttributeLabel(cacheKey, primary);
      return primary;
    }

    if (lang !== 'en') {
      const enAttributes = loadTranslation('en', 'attributes');
      if (
        enAttributes &&
        typeof enAttributes === 'object' &&
        !Array.isArray(enAttributes)
      ) {
        const fallback = resolveAttributeLabelFromStore(
          enAttributes as Record<string, unknown>,
          type,
          normalizedValue,
        );
        if (fallback) {
          setCachedAttributeLabel(cacheKey, fallback);
          return fallback;
        }
      }
    }

    setCachedAttributeLabel(cacheKey, value);
    return value;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Failed to get attribute label: ${lang}/${type}/${value}`, error);
    }
    return value;
  }
}

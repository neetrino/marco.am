'use client';

/**
 * Client-side i18n React hook
 * This file contains React hooks that can only be used in Client Components
 */

import { useMemo, useCallback, useContext } from 'react';
import { type LanguageCode } from './language';
import { t, getProductText, getAttributeLabel, type ProductField } from './i18n';
import { LanguagePreferenceContext } from './language-context';

/**
 * React hook for translations in client components
 * Automatically handles language updates and memoization
 * 
 * @returns Object with translation function and current language
 * 
 * @example
 * ```tsx
 * const { t, lang } = useTranslation();
 * return <button>{t('common.buttons.addToCart')}</button>;
 * ```
 */
export function useTranslation() {
  const lang = useContext(LanguagePreferenceContext);

  // Memoized translation function with validation
  const translate = useCallback(
    (path: string) => {
      if (!path || typeof path !== 'string') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[i18n] useTranslation: Invalid path provided to t()', path);
        }
        return '';
      }
      return t(lang, path);
    },
    [lang]
  );

  // Memoized product text getter
  const getProduct = useCallback(
    (productId: string, field: ProductField) => {
      if (!productId || typeof productId !== 'string') {
        return '';
      }
      return getProductText(lang, productId, field);
    },
    [lang]
  );

  // Memoized attribute label getter
  const getAttribute = useCallback(
    (type: string, value: string) => {
      if (!type || !value || typeof type !== 'string' || typeof value !== 'string') {
        return value || '';
      }
      return getAttributeLabel(lang, type, value);
    },
    [lang]
  );

  return useMemo(
    () => ({
      t: translate,
      lang,
      getProductText: getProduct,
      getAttributeLabel: getAttribute,
    }),
    [translate, lang, getProduct, getAttribute]
  );
}




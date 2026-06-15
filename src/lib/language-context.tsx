'use client';

import {
  createContext,
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  type ReactNode,
} from 'react';
import type { LanguageCode } from './language';
import { getStoredLanguage } from './language';
import { scheduleIdleSync } from './deferred-idle-sync';
import { clearTranslationCache } from './i18n/translation-cache';
import {
  ensureStorefrontLanguageLoaded,
  preloadEnglishFallbackLanguage,
} from './i18n/load-storefront-language';

const ENGLISH_FALLBACK_PRELOAD_DEFER_MS = 2_000;

export const LanguagePreferenceContext = createContext<LanguageCode>('en');

/**
 * Keeps client UI locale aligned with the server (cookie) and with `localStorage` / language switcher.
 */
export function LanguagePreferenceProvider({
  initialLanguage,
  children,
}: {
  readonly initialLanguage: LanguageCode;
  readonly children: ReactNode;
}) {
  const [lang, setLang] = useState<LanguageCode>(initialLanguage);

  const applyLanguage = useCallback(async (next: LanguageCode) => {
    await ensureStorefrontLanguageLoaded(next);
    setLang((prev) => {
      if (prev === next) {
        return prev;
      }
      clearTranslationCache();
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    const stored = getStoredLanguage();
    if (stored !== initialLanguage) {
      void applyLanguage(stored);
    }
  }, [applyLanguage, initialLanguage]);

  useEffect(() => {
    if (initialLanguage === 'en') {
      return;
    }
    return scheduleIdleSync(preloadEnglishFallbackLanguage, ENGLISH_FALLBACK_PRELOAD_DEFER_MS);
  }, [initialLanguage]);

  useEffect(() => {
    const sync = () => {
      const next = getStoredLanguage();
      void applyLanguage(next);
    };

    window.addEventListener('language-updated', sync);
    return () => window.removeEventListener('language-updated', sync);
  }, [applyLanguage]);

  return (
    <LanguagePreferenceContext.Provider value={lang}>
      {children}
    </LanguagePreferenceContext.Provider>
  );
}

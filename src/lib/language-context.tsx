'use client';

import {
  createContext,
  useState,
  useEffect,
  useLayoutEffect,
  type ReactNode,
} from 'react';
import type { LanguageCode } from './language';
import { getStoredLanguage } from './language';
import { clearTranslationCache } from './i18n';

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

  useLayoutEffect(() => {
    const stored = getStoredLanguage();
    setLang((prev) => {
      if (stored === prev) {
        return prev;
      }
      clearTranslationCache();
      return stored;
    });
  }, []);

  useEffect(() => {
    const sync = () => {
      const next = getStoredLanguage();
      setLang((prev) => {
        if (next === prev) {
          return prev;
        }
        clearTranslationCache();
        return next;
      });
    };

    sync();
    window.addEventListener('language-updated', sync);
    return () => window.removeEventListener('language-updated', sync);
  }, []);

  return (
    <LanguagePreferenceContext.Provider value={lang}>
      {children}
    </LanguagePreferenceContext.Provider>
  );
}

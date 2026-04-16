'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  getStoredLanguage,
  persistLanguageCookie,
  readLanguageCookie,
} from '../lib/language';

/**
 * Keeps the locale cookie aligned with localStorage and refreshes RSC payloads
 * when the user changes language (no full page reload).
 */
export function LanguageRouterRefresh() {
  const router = useRouter();
  const refreshQueued = useRef(false);

  useEffect(() => {
    const stored = getStoredLanguage();
    const cookieBefore = readLanguageCookie();
    persistLanguageCookie(stored);
    const needsRscSync =
      (cookieBefore !== null && cookieBefore !== stored) ||
      (cookieBefore === null && stored !== 'en');
    if (needsRscSync) {
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    const onLanguageUpdated = () => {
      persistLanguageCookie(getStoredLanguage());
      if (refreshQueued.current) return;
      refreshQueued.current = true;
      requestAnimationFrame(() => {
        refreshQueued.current = false;
        router.refresh();
      });
    };

    window.addEventListener('language-updated', onLanguageUpdated);
    return () => {
      window.removeEventListener('language-updated', onLanguageUpdated);
    };
  }, [router]);

  return null;
}

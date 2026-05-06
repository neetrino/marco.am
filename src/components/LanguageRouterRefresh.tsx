'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  getStoredLanguage,
  persistLanguageCookie,
  readLanguageCookie,
} from '../lib/language';

/**
 * Keeps the locale cookie aligned with localStorage.
 * Also refreshes RSC payload after language switch so server-rendered text
 * updates without a full page reload.
 */
export function LanguageRouterRefresh() {
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredLanguage();
    const cookieBefore = readLanguageCookie();
    persistLanguageCookie(stored);

    // First client mount: when SSR cookie differs from storage, sync server-rendered fragments once.
    if (cookieBefore !== null && cookieBefore !== stored) {
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    const onLanguageUpdated = () => {
      persistLanguageCookie(getStoredLanguage());
      router.refresh();
    };

    window.addEventListener('language-updated', onLanguageUpdated);
    return () => {
      window.removeEventListener('language-updated', onLanguageUpdated);
    };
  }, [router]);

  return null;
}

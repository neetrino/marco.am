'use client';

import { useEffect } from 'react';
import { getStoredLanguage, LANGUAGE_PREFERENCE_KEY } from '../lib/language';

const ONE_YEAR_S = 60 * 60 * 24 * 365;

/**
 * Mirrors `localStorage` language into the `shop_language` cookie so server components
 * (e.g. products page) can render the same locale as the header.
 */
export function LanguagePreferenceCookieSync() {
  useEffect(() => {
    const lang = getStoredLanguage();
    document.cookie = `${LANGUAGE_PREFERENCE_KEY}=${encodeURIComponent(lang)};path=/;max-age=${ONE_YEAR_S};SameSite=Lax`;
  }, []);
  return null;
}

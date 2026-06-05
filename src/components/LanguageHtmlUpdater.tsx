'use client';

import { useContext, useEffect } from 'react';
import { LanguagePreferenceContext } from '../lib/language-context';

/**
 * Updates the html lang attribute when locale changes (SEO + accessibility).
 */
export function LanguageHtmlUpdater() {
  const lang = useContext(LanguagePreferenceContext);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  return null;
}

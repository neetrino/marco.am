// Language utilities
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  hy: { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  ka: { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;
export const DEFAULT_LANGUAGE: LanguageCode = 'en';

/** Same key for localStorage and optional SSR cookie (`layout`). */
export const LANGUAGE_PREFERENCE_KEY = 'shop_language';
const LANGUAGE_STORAGE_KEY = LANGUAGE_PREFERENCE_KEY;

/**
 * Read `shop_language` from `document.cookie` (set by server / Header).
 * Used when localStorage is empty so client matches SSR locale (e.g. Armenian).
 */
function readLanguageFromCookie(): LanguageCode | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const prefix = `${LANGUAGE_STORAGE_KEY}=`;
  const row = document.cookie.split('; ').find((c) => c.startsWith(prefix));
  if (!row) {
    return null;
  }
  const raw = decodeURIComponent(row.slice(prefix.length));
  if (!raw || !(raw in LANGUAGES)) {
    return null;
  }
  const code = raw as LanguageCode;
  return code === 'ka' ? 'en' : code;
}

export function readLanguageCookie(): LanguageCode | null {
  return readLanguageFromCookie();
}

export function persistLanguageCookie(language: LanguageCode): void {
  if (typeof document === 'undefined') {
    return;
  }
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LANGUAGE_STORAGE_KEY}=${encodeURIComponent(language)};path=/;max-age=${maxAge};SameSite=Lax`;
}

export function getStoredLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && stored in LANGUAGES) {
      const code = stored as LanguageCode;
      return code === 'ka' ? 'en' : code;
    }
    const fromCookie = readLanguageFromCookie();
    if (fromCookie) {
      return fromCookie;
    }
  } catch {
    // Ignore errors
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Parse language from a cookie or other server-provided string (e.g. layout).
 * Returns undefined if the value is missing or not a supported code.
 */
export function parseLanguageFromServer(raw: string | undefined): LanguageCode | undefined {
  if (!raw || !(raw in LANGUAGES)) {
    return undefined;
  }
  const code = raw as LanguageCode;
  return code === 'ka' ? 'en' : code;
}

export function setStoredLanguage(
  language: LanguageCode,
  _options?: { skipReload?: boolean }
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${LANGUAGE_STORAGE_KEY}=${encodeURIComponent(language)};path=/;max-age=${maxAge};SameSite=Lax`;
    window.dispatchEvent(new Event('language-updated'));
  } catch (error) {
    console.error('Failed to save language:', error);
  }
}


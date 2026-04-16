import { cookies } from 'next/headers';
import {
  LANGUAGE_STORAGE_KEY,
  type LanguageCode,
  LANGUAGES,
} from './language';

/**
 * Resolves locale for Server Components from the cookie set by `setStoredLanguage`.
 */
export async function getServerLanguage(): Promise<LanguageCode> {
  const jar = await cookies();
  const raw = jar.get(LANGUAGE_STORAGE_KEY)?.value;
  if (raw && raw in LANGUAGES) {
    return raw as LanguageCode;
  }
  return 'en';
}

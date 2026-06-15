import { cookies } from 'next/headers';

import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from './language';

/** Resolves the visitor language for static server-rendered pages. */
export async function resolveServerPageLanguage(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  return parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
}

/** Formats "last updated" line consistently with prior client pages. */
export function formatLegalPageDate(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

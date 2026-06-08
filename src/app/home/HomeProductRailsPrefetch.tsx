import { cookies } from 'next/headers';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { getHomeProductRailsDataCached } from './home-product-rails-data';

/**
 * Starts the shared rails fetch early so `HomeProductRailsBoundary` hits React `cache()` immediately.
 */
export async function HomeProductRailsPrefetch() {
  const cookieStore = await cookies();
  const lang: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  await getHomeProductRailsDataCached(lang);
  return null;
}

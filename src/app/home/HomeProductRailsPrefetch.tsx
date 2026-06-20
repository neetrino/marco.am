import { DEFAULT_STOREFRONT_LANGUAGE } from '@/lib/language';
import { getHomeProductRailsDataCached } from './home-product-rails-data';

/**
 * Starts the shared rails fetch early so `HomeProductRailsBoundary` hits React `cache()` immediately.
 * Uses the default language; client rails refetch in the visitor's language after hydration.
 */
export async function HomeProductRailsPrefetch() {
  await getHomeProductRailsDataCached(DEFAULT_STOREFRONT_LANGUAGE);
  return null;
}

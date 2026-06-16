import type { LanguageCode } from '@/lib/language';
import { SHOP_PLP_DEFAULT_PAGE_SIZE } from '@/lib/constants/shop-plp-pagination';
import { getProductsListingCached } from '@/lib/cache/products-listing-redis';
import { logger } from '@/lib/utils/logger';

const WARM_LOCALES: LanguageCode[] = ['hy', 'en'];

const SHOP_PLP_WARM_BASE = {
  page: 1,
  limit: SHOP_PLP_DEFAULT_PAGE_SIZE,
  listingOmitProductAttributes: true,
  plpLeanListing: true,
} as const;

/**
 * Primes Redis for the default storefront PLP (`/products` page 1, no filters).
 */
export async function warmShopPlpListingCache(): Promise<void> {
  const started = Date.now();
  const tasks = WARM_LOCALES.map((lang) =>
    getProductsListingCached({
      ...SHOP_PLP_WARM_BASE,
      lang,
    }),
  );

  const outcomes = await Promise.allSettled(tasks);
  const failed = outcomes.filter((outcome) => outcome.status === 'rejected').length;
  logger.info('[warmShopPlpListingCache] finished', {
    ms: Date.now() - started,
    tasks: outcomes.length,
    failed,
  });
}

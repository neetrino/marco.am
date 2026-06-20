import type { LanguageCode } from '@/lib/language';
import { SHOP_PLP_DEFAULT_PAGE_SIZE } from '@/lib/constants/shop-plp-pagination';
import { getProductsPlpReadModelPayload } from '@/lib/read-model/products-plp-read-model';
import { logger } from '@/lib/utils/logger';

const WARM_LOCALES: LanguageCode[] = ['hy', 'en', 'ru'];

const SHOP_PLP_WARM_BASE = {
  page: '1',
  limit: String(SHOP_PLP_DEFAULT_PAGE_SIZE),
} as const;

/**
 * Primes Redis for the default storefront PLP (`/products` page 1, no filters).
 */
export async function warmShopPlpListingCache(): Promise<void> {
  const started = Date.now();
  const tasks = WARM_LOCALES.map((lang) =>
    getProductsPlpReadModelPayload({
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

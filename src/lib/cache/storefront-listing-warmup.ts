import { warmHomeListingCache } from '@/lib/cache/warm-home-listing-cache';
import { warmShopPlpListingCache } from '@/lib/cache/warm-shop-plp-cache';
import { warmPublicShopCaches } from '@/lib/cache/cache-warm-boot';
import { logger } from '@/lib/utils/logger';

/**
 * Best-effort Redis warm for hot anonymous storefront paths (home rails + default PLP).
 * Invoked via `/api/v1/internal/warm-storefront-listing` after server boot
 * (see `HOME_CACHE_WARMUP` / `CACHE_WARM_ON_START`).
 */
export async function warmStorefrontListingCaches(): Promise<void> {
  const started = Date.now();
  await warmPublicShopCaches().catch((error: unknown) => {
    logger.warn('[warmStorefrontListingCaches] public caches failed', { error });
  });
  await Promise.allSettled([warmHomeListingCache(), warmShopPlpListingCache()]);
  logger.info('[warmStorefrontListingCaches] finished', { ms: Date.now() - started });
}

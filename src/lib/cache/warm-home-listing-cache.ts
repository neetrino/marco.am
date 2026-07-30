import { SPECIAL_OFFERS_PRODUCTS_LIMIT } from '@/constants/specialOffersSection';
import { HOME_NEW_ARRIVALS_SELECTION_POOL_SIZE } from '@/lib/home/home-new-arrivals-selection';
import type { LanguageCode } from '@/lib/language';
import { getProductsPlpReadModelPayload } from '@/lib/read-model/products-plp-read-model';
import { homeBrandPartnersService } from '@/lib/services/home-brand-partners.service';
import { bannerManagementService } from '@/lib/services/banner-management.service';
import { reelsManagementService } from '@/lib/services/reels-management.service';
import { logger } from '@/lib/utils/logger';

const WARM_LOCALES: LanguageCode[] = ['hy', 'en'];

const HOME_STRIP_LISTING_BASE = {
  page: '1',
  includeFilters: '0',
  sort: 'createdAt' as const,
};

/**
 * Primes Redis/in-memory caches for home SSR chunks (dev cold start + after deploy).
 */
export async function warmHomeListingCache(): Promise<void> {
  const started = Date.now();
  const tasks: Promise<unknown>[] = [];

  for (const lang of WARM_LOCALES) {
    tasks.push(
      getProductsPlpReadModelPayload({
        ...HOME_STRIP_LISTING_BASE,
        limit: String(SPECIAL_OFFERS_PRODUCTS_LIMIT),
        lang,
        filter: 'promotion',
      }),
      getProductsPlpReadModelPayload({
        ...HOME_STRIP_LISTING_BASE,
        limit: String(HOME_NEW_ARRIVALS_SELECTION_POOL_SIZE),
        lang,
        filter: 'new',
      }),
      getProductsPlpReadModelPayload({
        ...HOME_STRIP_LISTING_BASE,
        limit: String(HOME_NEW_ARRIVALS_SELECTION_POOL_SIZE),
        lang,
      }),
      homeBrandPartnersService.getPublicPayload(lang),
      bannerManagementService.getPublicSlotPayload({
        slot: 'home.promo.strip',
        localeRaw: lang,
      }),
      bannerManagementService.getPublicHomeHeroSlotsPayload({ localeRaw: lang }),
      reelsManagementService.getPublicPayload({ localeRaw: lang }),
    );
  }

  const outcomes = await Promise.allSettled(tasks);
  const failed = outcomes.filter((o) => o.status === 'rejected').length;
  logger.info('[warmHomeListingCache] finished', {
    ms: Date.now() - started,
    tasks: outcomes.length,
    failed,
  });
}

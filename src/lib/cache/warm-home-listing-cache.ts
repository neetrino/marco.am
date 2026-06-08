import { FEATURED_PRODUCTS_VISIBLE_COUNT } from '@/components/featured-products-tabs.constants';
import { SPECIAL_OFFERS_PRODUCTS_LIMIT } from '@/constants/specialOffersSection';
import type { LanguageCode } from '@/lib/language';
import { getProductsListingCached } from '@/lib/cache/products-listing-redis';
import { homeBrandPartnersService } from '@/lib/services/home-brand-partners.service';
import { bannerManagementService } from '@/lib/services/banner-management.service';
import { reelsManagementService } from '@/lib/services/reels-management.service';
import { logger } from '@/lib/utils/logger';

const WARM_LOCALES: LanguageCode[] = ['hy', 'en'];

const HOME_STRIP_LISTING_BASE = {
  page: 1,
  listingOmitProductAttributes: true,
  skipExactTotalCount: true,
  homeStripListing: true,
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
      getProductsListingCached({
        ...HOME_STRIP_LISTING_BASE,
        limit: SPECIAL_OFFERS_PRODUCTS_LIMIT,
        lang,
        filter: 'promotion',
      }),
      getProductsListingCached({
        ...HOME_STRIP_LISTING_BASE,
        limit: FEATURED_PRODUCTS_VISIBLE_COUNT,
        lang,
        filter: 'new',
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

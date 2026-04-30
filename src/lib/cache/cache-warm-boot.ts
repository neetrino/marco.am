import { getProductsListingCached } from '@/lib/cache/products-listing-redis';
import { FEATURED_PRODUCTS_VISIBLE_COUNT } from '@/components/featured-products-tabs.constants';
import { SPECIAL_OFFERS_PRODUCTS_LIMIT } from '@/constants/specialOffersSection';
import { bannerManagementService } from '@/lib/services/banner-management.service';
import { categoriesService } from '@/lib/services/categories.service';

const WARM_LOCALES = ['en', 'hy', 'ru'] as const;

/**
 * Populates Redis (or in-memory fallback) for hot anonymous paths.
 * Opt-in: set `CACHE_WARM_ON_START=1` on the Node server (e.g. after deploy).
 * Safe: public catalog + navigation only; no user/session data.
 */
export async function warmPublicShopCaches(): Promise<void> {
  await Promise.all([
    ...WARM_LOCALES.map((localeRaw) =>
      bannerManagementService.getPublicHomeHeroSlotsPayload({ localeRaw }),
    ),
    ...WARM_LOCALES.map((lang) => categoriesService.getTree(lang)),
    ...WARM_LOCALES.map((lang) =>
      getProductsListingCached({
        page: 1,
        limit: FEATURED_PRODUCTS_VISIBLE_COUNT,
        lang,
        filter: 'new',
        sort: 'createdAt',
        listingOmitProductAttributes: true,
      }),
    ),
    ...WARM_LOCALES.map((lang) =>
      getProductsListingCached({
        page: 1,
        limit: SPECIAL_OFFERS_PRODUCTS_LIMIT,
        lang,
        filter: 'promotion',
        sort: 'createdAt',
        listingOmitProductAttributes: true,
      }),
    ),
    getProductsListingCached({
      page: 1,
      limit: 12,
      lang: 'en',
      listingOmitProductAttributes: true,
    }),
  ]);
}

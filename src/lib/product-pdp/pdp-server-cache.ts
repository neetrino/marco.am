import type { LanguageCode } from '@/lib/language';
import {
  buildPdpSsrDetailCacheKey,
  buildPdpSsrRelatedCacheKey,
} from '@/lib/product-pdp/pdp-cache-keys';
import { RELATED_PRODUCTS_PAGE_SIZE } from '@/lib/product-pdp/related-products.constants';
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { productsRelatedService } from '@/lib/services/products-related.service';
import { productsService } from '@/lib/services/products.service';

const PDP_DETAIL_CACHE_TTL_SEC = 180;
const PDP_RELATED_CACHE_TTL_SEC = 300;

/**
 * Shared Redis-backed cache for full PDP SSR detail payload.
 */
export async function getCachedPdpDetail(slug: string, lang: LanguageCode) {
  return getCachedJson(
    buildPdpSsrDetailCacheKey(slug, lang),
    PDP_DETAIL_CACHE_TTL_SEC,
    () => productsService.findBySlug(slug, lang),
    { requireSharedCache: true },
  );
}

/** SSR + edge cache for PDP related carousel (first page). */
export async function getCachedPdpRelated(slug: string, lang: LanguageCode) {
  return getCachedJson(
    buildPdpSsrRelatedCacheKey(slug, lang),
    PDP_RELATED_CACHE_TTL_SEC,
    () =>
      productsRelatedService.findBySlug(
        slug,
        lang,
        RELATED_PRODUCTS_PAGE_SIZE,
        0,
      ),
    { requireSharedCache: true },
  );
}

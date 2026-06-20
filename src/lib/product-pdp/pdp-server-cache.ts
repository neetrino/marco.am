import { cache } from 'react';
import type { LanguageCode } from '@/lib/language';
import {
  buildPdpSsrDetailCacheKey,
  buildPdpSsrRelatedCacheKey,
} from '@/lib/product-pdp/pdp-cache-keys';
import { RELATED_PRODUCTS_PAGE_SIZE } from '@/lib/product-pdp/related-products.constants';
import { PDP_CACHE_TTL_SEC } from '@/lib/product-pdp/pdp-cache-ttl';
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { productsRelatedService } from '@/lib/services/products-related.service';
import { productsService } from '@/lib/services/products.service';

const PDP_DETAIL_CACHE_TTL_SEC = PDP_CACHE_TTL_SEC;
const PDP_RELATED_CACHE_TTL_SEC = PDP_CACHE_TTL_SEC;

/**
 * Shared Redis-backed cache for full PDP SSR detail payload.
 * Wrapped in React `cache()` so the metadata + 404 gate + SSR seed share one
 * result per render instead of issuing three independent cache reads.
 */
export const getCachedPdpDetail = cache(async (slug: string, lang: LanguageCode) => {
  return getCachedJson(
    buildPdpSsrDetailCacheKey(slug, lang),
    PDP_DETAIL_CACHE_TTL_SEC,
    () => productsService.findBySlug(slug, lang),
    { requireSharedCache: true },
  );
});

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

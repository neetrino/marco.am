import { createHash } from 'node:crypto';

import type { LanguageCode } from '@/lib/language';
import { RELATED_PRODUCTS_PAGE_SIZE } from '@/lib/product-pdp/related-products.constants';
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { productsRelatedService } from '@/lib/services/products-related.service';
import { productsService } from '@/lib/services/products.service';

const PDP_VISUAL_CACHE_TTL_SEC = 180;
const PDP_DETAIL_CACHE_TTL_SEC = 180;
const PDP_RELATED_CACHE_TTL_SEC = 300;

/**
 * Shared Redis-backed cache for PDP first-paint visual payload.
 */
export async function getCachedPdpVisual(slug: string, lang: LanguageCode) {
  const key = createHash('sha256')
    .update(`pdp:ssr:visual:v2\0${slug}\0${lang}`)
    .digest('hex');
  return getCachedJson(
    `cache:products:pdp:ssr:visual:v2:${key}`,
    PDP_VISUAL_CACHE_TTL_SEC,
    () => productsService.findBySlugVisual(slug, lang),
    { requireSharedCache: true },
  );
}

/**
 * Shared Redis-backed cache for full PDP SSR detail payload.
 */
export async function getCachedPdpDetail(slug: string, lang: LanguageCode) {
  const key = createHash('sha256')
    .update(`pdp:ssr:detail:v2\0${slug}\0${lang}`)
    .digest('hex');
  return getCachedJson(
    `cache:products:pdp:ssr:detail:v2:${key}`,
    PDP_DETAIL_CACHE_TTL_SEC,
    () => productsService.findBySlug(slug, lang),
    { requireSharedCache: true },
  );
}

/** SSR + edge cache for PDP related carousel (first page). */
export async function getCachedPdpRelated(slug: string, lang: LanguageCode) {
  const key = createHash('sha256')
    .update(
      `pdp:ssr:related:v2\x00${slug}\x00${lang}\x00${RELATED_PRODUCTS_PAGE_SIZE}\x000`,
    )
    .digest('hex');
  return getCachedJson(
    `cache:products:pdp:ssr:related:v2:${key}`,
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

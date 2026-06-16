import { createHash } from 'node:crypto';

import type { LanguageCode } from '@/lib/language';
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { productsRelatedService } from '@/lib/services/products-related.service';
import { productsService } from '@/lib/services/products.service';
import { db } from '@white-shop/db';

import { RELATED_PRODUCTS_PAGE_SIZE } from './related-products.constants';

export const PDP_RELATED_SSR_LIMIT = RELATED_PRODUCTS_PAGE_SIZE;
const PDP_EXISTS_CACHE_TTL_SEC = 180;
const PDP_VISUAL_CACHE_TTL_SEC = 180;
const PDP_DETAIL_CACHE_TTL_SEC = 180;
const PDP_RELATED_CACHE_TTL_SEC = 300;

/**
 * Minimal published-product existence check for early PDP 404s.
 */
export async function getCachedPdpExists(slug: string): Promise<boolean> {
  const key = createHash('sha256')
    .update(`pdp:ssr:exists:v1\0${slug}`)
    .digest('hex');
  return getCachedJson(
    `cache:products:pdp:ssr:exists:v1:${key}`,
    PDP_EXISTS_CACHE_TTL_SEC,
    async () => {
      const product = await db.product.findFirst({
        where: {
          translations: {
            some: { slug },
          },
          published: true,
          deletedAt: null,
        },
        select: { id: true },
      });
      return product !== null;
    },
    { requireSharedCache: true },
  );
}

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

/**
 * Shared Redis-backed cache for PDP related products SSR payload.
 */
export async function getCachedPdpRelated(
  slug: string,
  lang: LanguageCode,
  limit: number,
) {
  const key = createHash('sha256')
    .update(`pdp:ssr:related:v2\0${slug}\0${lang}\0${limit}`)
    .digest('hex');
  return getCachedJson(
    `cache:products:pdp:ssr:related:v2:${key}`,
    PDP_RELATED_CACHE_TTL_SEC,
    () => productsRelatedService.findBySlug(slug, lang, limit),
    { requireSharedCache: true },
  );
}

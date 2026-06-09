import { unstable_cache } from 'next/cache';

import type { LanguageCode } from '@/lib/language';
import { productsRelatedService } from '@/lib/services/products-related.service';
import { productsService } from '@/lib/services/products.service';

import { RELATED_PRODUCTS_FETCH_LIMIT } from './related-products.constants';
import { PDP_NEXT_CACHE_REVALIDATE_SECONDS } from './pdp-query-cache';

export const PDP_RELATED_SSR_LIMIT = RELATED_PRODUCTS_FETCH_LIMIT;

/**
 * Cached Prisma read for PDP first paint (shared with pre-App Router path).
 */
export const getCachedPdpVisual = unstable_cache(
  async (slug: string, lang: LanguageCode) => productsService.findBySlugVisual(slug, lang),
  ['pdp-ssr-visual-v1'],
  { revalidate: PDP_NEXT_CACHE_REVALIDATE_SECONDS },
);

/**
 * Full PDP product payload for SSR → hydrates React Query without a client round-trip on refresh.
 */
export const getCachedPdpDetail = unstable_cache(
  async (slug: string, lang: LanguageCode) => productsService.findBySlug(slug, lang),
  ['pdp-ssr-detail-v1'],
  { revalidate: PDP_NEXT_CACHE_REVALIDATE_SECONDS },
);

/**
 * Related carousel rows for SSR — hydrates React Query so the PDP section paints without a client round-trip.
 */
export const getCachedPdpRelated = unstable_cache(
  async (slug: string, lang: LanguageCode, limit: number) =>
    productsRelatedService.findBySlug(slug, lang, limit),
  ['pdp-ssr-related-v1'],
  { revalidate: PDP_NEXT_CACHE_REVALIDATE_SECONDS },
);

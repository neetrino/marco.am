import { unstable_cache } from 'next/cache';

import type { LanguageCode } from '@/lib/language';
import { productsService } from '@/lib/services/products.service';

import { PDP_NEXT_CACHE_REVALIDATE_SECONDS } from './pdp-query-cache';

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

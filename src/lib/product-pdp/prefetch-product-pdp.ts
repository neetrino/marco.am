import type { QueryClient } from '@tanstack/react-query';

import { RESERVED_ROUTES } from '@/app/products/[slug]/types';
import { type LanguageCode } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';

import {
  PDP_QUERY_GC_TIME_MS,
  PDP_QUERY_STALE_TIME_MS,
  PDP_RELATED_GC_TIME_MS,
  PDP_RELATED_STALE_TIME_MS,
} from './pdp-query-cache';
import { fetchProductDetail, fetchProductVisual } from './product-pdp-fetchers';
import { fetchRelatedProducts } from './fetch-related-products';

const RELATED_PREFETCH_LIMIT = 10;

function baseProductSlug(raw: string): string {
  const parts = raw.includes(':') ? raw.split(':') : [raw];
  return parts[0] ?? raw;
}

/**
 * Warms React Query cache before navigating to `/products/[slug]` so the PDP paints faster
 * (especially the main image from `/visual`).
 */
export function prefetchProductPdp(
  queryClient: QueryClient,
  rawSlug: string,
  lang: LanguageCode,
): Promise<void> {
  const slug = baseProductSlug(rawSlug);
  if (!slug || RESERVED_ROUTES.includes(slug.toLowerCase())) {
    return Promise.resolve();
  }

  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.productVisual(slug, lang),
      queryFn: () => fetchProductVisual(slug, lang),
      staleTime: PDP_QUERY_STALE_TIME_MS,
      gcTime: PDP_QUERY_GC_TIME_MS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.productDetail(slug, lang),
      queryFn: () => fetchProductDetail(slug, lang),
      staleTime: PDP_QUERY_STALE_TIME_MS,
      gcTime: PDP_QUERY_GC_TIME_MS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.relatedProducts(slug, lang, RELATED_PREFETCH_LIMIT),
      queryFn: () => fetchRelatedProducts(slug, lang, RELATED_PREFETCH_LIMIT),
      staleTime: PDP_RELATED_STALE_TIME_MS,
      gcTime: PDP_RELATED_GC_TIME_MS,
    }),
  ]).then(() => undefined);
}

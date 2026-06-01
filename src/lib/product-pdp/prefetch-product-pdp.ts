import type { QueryClient } from '@tanstack/react-query';

import { RESERVED_ROUTES } from '@/app/products/[slug]/types';
import { type LanguageCode } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';

import {
  PDP_QUERY_GC_TIME_MS,
  PDP_QUERY_STALE_TIME_MS,
} from './pdp-query-cache';
import { fetchProductDetail, fetchProductVisual } from './product-pdp-fetchers';

function baseProductSlug(raw: string): string {
  const parts = raw.includes(':') ? raw.split(':') : [raw];
  return parts[0] ?? raw;
}

/**
 * Warms React Query cache before navigating to `/products/[slug]` so the PDP paints faster
 * (gallery from `/visual`, price/actions from full detail).
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

  const visualPrefetch = queryClient.prefetchQuery({
    queryKey: queryKeys.productVisual(slug, lang),
    queryFn: () => fetchProductVisual(slug, lang),
    staleTime: PDP_QUERY_STALE_TIME_MS,
    gcTime: PDP_QUERY_GC_TIME_MS,
  });

  const detailPrefetch = queryClient.prefetchQuery({
    queryKey: queryKeys.productDetail(slug, lang),
    queryFn: () => fetchProductDetail(slug, lang),
    staleTime: PDP_QUERY_STALE_TIME_MS,
    gcTime: PDP_QUERY_GC_TIME_MS,
  });

  return Promise.all([visualPrefetch, detailPrefetch]).then(() => undefined);
}

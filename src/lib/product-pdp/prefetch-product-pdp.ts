import type { QueryClient } from '@tanstack/react-query';

import { RESERVED_ROUTES } from '@/app/products/[slug]/types';
import type { Product } from '@/app/products/[slug]/types';
import { type LanguageCode } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';

import {
  PDP_QUERY_GC_TIME_MS,
  PDP_QUERY_STALE_TIME_MS,
  PDP_RELATED_GC_TIME_MS,
  PDP_RELATED_STALE_TIME_MS,
} from './pdp-query-cache';
import { fetchProductDetail } from './product-pdp-fetchers';
import { fetchRelatedProducts, hasUsableRelatedPayload } from './fetch-related-products';
import type { RelatedProductsApiResponse } from './fetch-related-products';
import { RELATED_PRODUCTS_PAGE_SIZE } from './related-products.constants';
import { isPdpListingShell } from './resolve-pdp-listing-shell';

function baseProductSlug(raw: string): string {
  const parts = raw.includes(':') ? raw.split(':') : [raw];
  return parts[0] ?? raw;
}

function hasFullProductDetails(product: Product | undefined): boolean {
  return product != null && !isPdpListingShell(product);
}

/**
 * Hover/focus prefetch — full PDP detail only when not already cached.
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

  const existingDetail = queryClient.getQueryData<Product>(
    queryKeys.productDetail(slug, lang),
  );

  if (hasFullProductDetails(existingDetail)) {
    return Promise.resolve();
  }

  return queryClient
    .prefetchQuery({
      queryKey: queryKeys.productDetail(slug, lang),
      queryFn: () => fetchProductDetail(slug, lang),
      staleTime: PDP_QUERY_STALE_TIME_MS,
      gcTime: PDP_QUERY_GC_TIME_MS,
    })
    .then(() => undefined);
}

/** Heavier related carousel — run on click when the user commits to opening the product. */
export function prefetchProductPdpOnCommit(
  queryClient: QueryClient,
  rawSlug: string,
  lang: LanguageCode,
): Promise<void> {
  const slug = baseProductSlug(rawSlug);
  if (!slug || RESERVED_ROUTES.includes(slug.toLowerCase())) {
    return Promise.resolve();
  }

  const existingDetail = queryClient.getQueryData<Product>(
    queryKeys.productDetail(slug, lang),
  );
  const existingRelated = queryClient.getQueryData<RelatedProductsApiResponse>(
    queryKeys.relatedProducts(slug, lang, RELATED_PRODUCTS_PAGE_SIZE),
  );

  const detailPrefetch = hasFullProductDetails(existingDetail)
    ? Promise.resolve()
    : queryClient.prefetchQuery({
        queryKey: queryKeys.productDetail(slug, lang),
        queryFn: () => fetchProductDetail(slug, lang),
        staleTime: PDP_QUERY_STALE_TIME_MS,
        gcTime: PDP_QUERY_GC_TIME_MS,
      });

  const relatedPrefetch = hasUsableRelatedPayload(existingRelated)
    ? Promise.resolve()
    : queryClient.prefetchQuery({
        queryKey: queryKeys.relatedProducts(slug, lang, RELATED_PRODUCTS_PAGE_SIZE),
        queryFn: () => fetchRelatedProducts(slug, lang, RELATED_PRODUCTS_PAGE_SIZE, 0),
        staleTime: PDP_RELATED_STALE_TIME_MS,
        gcTime: PDP_RELATED_GC_TIME_MS,
      });

  return Promise.all([detailPrefetch, relatedPrefetch]).then(() => undefined);
}

import type { QueryClient } from '@tanstack/react-query';

import type { Product } from '@/app/products/[slug]/types';
import { RESERVED_ROUTES } from '@/app/products/[slug]/types';
import { type LanguageCode } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';
import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';

import {
  PDP_QUERY_GC_TIME_MS,
  PDP_QUERY_STALE_TIME_MS,
} from './pdp-query-cache';
import { fetchProductSummary, fetchProductVisual } from './product-pdp-fetchers';

function baseProductSlug(raw: string): string {
  const parts = raw.includes(':') ? raw.split(':') : [raw];
  return parts[0] ?? raw;
}

function hasFullProductDetails(product: Product | undefined): boolean {
  if (!product) {
    return false;
  }
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return true;
  }
  if (Array.isArray(product.description) && product.description.length > 0) {
    return true;
  }
  if (Array.isArray(product.productAttributes) && product.productAttributes.length > 0) {
    return true;
  }
  return false;
}

function hasRichVisualPayload(payload: PdpVisualPayload | undefined): boolean {
  if (!payload) {
    return false;
  }
  if (Array.isArray(payload.gallery) && payload.gallery.length > 0) {
    return true;
  }
  return Array.isArray(payload.images) && payload.images.length > 1;
}

/**
 * Warms the light PDP payload before navigating to `/products/[slug]`.
 *
 * Keep hover/focus prefetch cheap: product grids can trigger many intent events while
 * the pointer moves across cards. Full detail and related products load from the PDP
 * flow after navigation, where the request is tied to a committed user action.
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

  const existingVisual = queryClient.getQueryData<PdpVisualPayload>(
    queryKeys.productVisual(slug, lang),
  );
  const existingDetail = queryClient.getQueryData<Product>(
    queryKeys.productDetail(slug, lang),
  );

  const visualPrefetch = hasRichVisualPayload(existingVisual)
    ? Promise.resolve()
    : queryClient.prefetchQuery({
        queryKey: queryKeys.productVisual(slug, lang),
        queryFn: () => fetchProductVisual(slug, lang),
        staleTime: PDP_QUERY_STALE_TIME_MS,
        gcTime: PDP_QUERY_GC_TIME_MS,
      });

  const detailPrefetch = hasFullProductDetails(existingDetail)
    ? Promise.resolve()
    : queryClient.prefetchQuery({
        queryKey: queryKeys.productDetail(slug, lang),
        queryFn: async () => {
          const summary = await fetchProductSummary(slug, lang);
          queryClient.setQueryData(queryKeys.productSummary(slug, lang), summary);
          return summary;
        },
        staleTime: PDP_QUERY_STALE_TIME_MS,
        gcTime: PDP_QUERY_GC_TIME_MS,
      });

  return Promise.all([visualPrefetch, detailPrefetch]).then(() => undefined);
}

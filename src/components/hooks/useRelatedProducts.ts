'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { dedupeCardProductsByTitle } from '../../lib/dedupeCardProductsByTitle';
import type { LanguageCode } from '../../lib/language';
import { queryKeys } from '../../lib/query-keys';
import {
  fetchRelatedProducts,
  hasUsableRelatedPayload,
  type RelatedProductRow,
  type RelatedProductsApiResponse,
} from '@/lib/product-pdp/fetch-related-products';
import { RELATED_PRODUCTS_FETCH_LIMIT } from '@/lib/product-pdp/related-products.constants';
import { PDP_RELATED_GC_TIME_MS, PDP_RELATED_STALE_TIME_MS } from '@/lib/product-pdp/pdp-query-cache';
import {
  getPersistedPdpRelated,
  setPersistedPdpRelated,
} from '@/lib/product-pdp/pdp-client-persist-cache';
import { getQueryClient } from '@/lib/query/get-query-client';

interface UseRelatedProductsProps {
  productSlug: string;
  language: LanguageCode;
  /** SSR payload — instant carousel on first paint when slug/lang match. */
  initialRelatedProducts?: RelatedProductsApiResponse | null;
  /** Gate fetch for staged PDP rendering. */
  enabled?: boolean;
}

export const RELATED_PRODUCTS_LIMIT = RELATED_PRODUCTS_FETCH_LIMIT;

/**
 * Related products for PDP — React Query cache + dedupe (shared key with hover prefetch).
 */
export function useRelatedProducts({
  productSlug,
  language,
  initialRelatedProducts = null,
  enabled = true,
}: UseRelatedProductsProps) {
  const trimmed = productSlug.trim();
  const hasSsrPayload = hasUsableRelatedPayload(initialRelatedProducts);

  const persistedInitialData = getPersistedPdpRelated(trimmed, language, RELATED_PRODUCTS_LIMIT);
  const hasCachedPayload =
    hasSsrPayload || hasUsableRelatedPayload(persistedInitialData);
  const initialData = hasSsrPayload
    ? initialRelatedProducts
    : hasUsableRelatedPayload(persistedInitialData)
      ? persistedInitialData
      : undefined;

  const queryClient = getQueryClient();

  const query = useQuery(
    {
      queryKey: queryKeys.relatedProducts(trimmed, language, RELATED_PRODUCTS_LIMIT),
      queryFn: () => fetchRelatedProducts(trimmed, language, RELATED_PRODUCTS_LIMIT),
      enabled: enabled && Boolean(trimmed),
      initialData,
      refetchOnMount: !hasSsrPayload,
      staleTime: PDP_RELATED_STALE_TIME_MS,
      gcTime: PDP_RELATED_GC_TIME_MS,
      retry: 1,
    },
    queryClient,
  );

  const products = useMemo((): RelatedProductRow[] => {
    const rows = query.data?.data;
    if (!rows?.length) {
      return [];
    }
    return dedupeCardProductsByTitle(rows).slice(0, RELATED_PRODUCTS_LIMIT);
  }, [query.data]);

  const loading =
    !hasCachedPayload &&
    products.length === 0 &&
    (query.isPending || query.isFetching);

  useEffect(() => {
    if (!trimmed || !hasUsableRelatedPayload(query.data)) {
      return;
    }
    setPersistedPdpRelated(trimmed, language, RELATED_PRODUCTS_LIMIT, query.data);
  }, [language, query.data, trimmed]);

  return { products, loading };
}

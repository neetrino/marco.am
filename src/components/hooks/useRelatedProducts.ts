'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { dedupeCardProductsByTitle } from '../../lib/dedupeCardProductsByTitle';
import type { LanguageCode } from '../../lib/language';
import { queryKeys } from '../../lib/query-keys';
import {
  fetchRelatedProducts,
  type RelatedProductRow,
  type RelatedProductsApiResponse,
} from '@/lib/product-pdp/fetch-related-products';
import { RELATED_PRODUCTS_FETCH_LIMIT } from '@/lib/product-pdp/related-products.constants';
import { PDP_RELATED_GC_TIME_MS, PDP_RELATED_STALE_TIME_MS } from '@/lib/product-pdp/pdp-query-cache';

interface UseRelatedProductsProps {
  productSlug: string;
  language: LanguageCode;
  /** SSR payload — instant carousel on first paint when slug/lang match. */
  initialRelatedProducts?: RelatedProductsApiResponse | null;
}

export const RELATED_PRODUCTS_LIMIT = RELATED_PRODUCTS_FETCH_LIMIT;

/**
 * Related products for PDP — React Query cache + dedupe (shared key with hover prefetch).
 */
export function useRelatedProducts({
  productSlug,
  language,
  initialRelatedProducts = null,
}: UseRelatedProductsProps) {
  const trimmed = productSlug.trim();

  const initialData = initialRelatedProducts ?? undefined;

  const query = useQuery({
    queryKey: queryKeys.relatedProducts(trimmed, language, RELATED_PRODUCTS_LIMIT),
    queryFn: () => fetchRelatedProducts(trimmed, language, RELATED_PRODUCTS_LIMIT),
    enabled: Boolean(trimmed),
    initialData,
    refetchOnMount: initialRelatedProducts === undefined,
    staleTime: PDP_RELATED_STALE_TIME_MS,
    gcTime: PDP_RELATED_GC_TIME_MS,
    retry: 1,
  });

  const products = useMemo((): RelatedProductRow[] => {
    const rows = query.data?.data;
    if (!rows?.length) {
      return [];
    }
    return dedupeCardProductsByTitle(rows).slice(0, RELATED_PRODUCTS_LIMIT);
  }, [query.data]);

  const loading =
    initialRelatedProducts === undefined && query.isPending && products.length === 0;

  return { products, loading };
}

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { dedupeCardProductsByTitle } from '../../lib/dedupeCardProductsByTitle';
import type { LanguageCode } from '../../lib/language';
import { queryKeys } from '../../lib/query-keys';
import {
  fetchRelatedProducts,
  type RelatedProductRow,
} from '@/lib/product-pdp/fetch-related-products';
import { PDP_RELATED_GC_TIME_MS, PDP_RELATED_STALE_TIME_MS } from '@/lib/product-pdp/pdp-query-cache';

interface UseRelatedProductsProps {
  productSlug: string;
  language: LanguageCode;
}

const RELATED_LIMIT = 10;

/**
 * Related products for PDP — React Query cache + dedupe (shared key with hover prefetch).
 */
export function useRelatedProducts({ productSlug, language }: UseRelatedProductsProps) {
  const trimmed = productSlug.trim();

  const query = useQuery({
    queryKey: queryKeys.relatedProducts(trimmed, language, RELATED_LIMIT),
    queryFn: () => fetchRelatedProducts(trimmed, language, RELATED_LIMIT),
    enabled: Boolean(trimmed),
    staleTime: PDP_RELATED_STALE_TIME_MS,
    gcTime: PDP_RELATED_GC_TIME_MS,
    retry: 1,
  });

  const products = useMemo((): RelatedProductRow[] => {
    const rows = query.data?.data;
    if (!rows?.length) {
      return [];
    }
    return dedupeCardProductsByTitle(rows).slice(0, RELATED_LIMIT);
  }, [query.data]);

  return { products, loading: query.isPending };
}

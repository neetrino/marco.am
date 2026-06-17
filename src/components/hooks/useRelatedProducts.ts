'use client';

import { useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { dedupeCardProductsByTitle } from '../../lib/dedupeCardProductsByTitle';
import type { LanguageCode } from '../../lib/language';
import { fetchRelatedProducts } from '@/lib/product-pdp/fetch-related-products';
import {
  PDP_RELATED_GC_TIME_MS,
  PDP_RELATED_STALE_TIME_MS,
} from '@/lib/product-pdp/pdp-query-cache';
import {
  persistRelatedProductsFirstPage,
  readRelatedProductsQuerySeed,
} from '@/lib/product-pdp/pdp-related-query-seed';
import { RELATED_PRODUCTS_PAGE_SIZE } from '@/lib/product-pdp/related-products.constants';
import { getQueryClient } from '@/lib/query/get-query-client';
import { queryKeys } from '@/lib/query-keys';

interface UseRelatedProductsProps {
  productSlug: string;
  language: LanguageCode;
  enabled?: boolean;
}

export const RELATED_PRODUCTS_LIMIT = RELATED_PRODUCTS_PAGE_SIZE;

function getRelatedNextOffset(
  lastPage: Awaited<ReturnType<typeof fetchRelatedProducts>>,
  _allPages: Awaited<ReturnType<typeof fetchRelatedProducts>>[],
  lastPageParam: number,
): number | undefined {
  const rows = lastPage.data?.length ?? 0;
  const hasMore = lastPage.meta?.hasMore ?? rows >= RELATED_PRODUCTS_PAGE_SIZE;
  if (!hasMore) {
    return undefined;
  }
  return lastPageParam + rows;
}

/**
 * Related products for PDP — React Query infinite page; SSR + sessionStorage seed.
 */
export function useRelatedProducts({
  productSlug,
  language,
  enabled = true,
}: UseRelatedProductsProps) {
  const trimmed = productSlug.trim();
  const queryClient = getQueryClient();
  const queryKey = queryKeys.relatedProducts(
    trimmed,
    language,
    RELATED_PRODUCTS_PAGE_SIZE,
  );

  const initialData = useMemo(
    () => readRelatedProductsQuerySeed(queryClient, trimmed, language),
    [queryClient, trimmed, language],
  );

  const query = useInfiniteQuery(
    {
      queryKey,
      queryFn: ({ pageParam }) =>
        fetchRelatedProducts(trimmed, language, RELATED_PRODUCTS_PAGE_SIZE, pageParam),
      initialPageParam: 0,
      getNextPageParam: getRelatedNextOffset,
      enabled: enabled && Boolean(trimmed),
      initialData,
      staleTime: PDP_RELATED_STALE_TIME_MS,
      gcTime: PDP_RELATED_GC_TIME_MS,
    },
    queryClient,
  );

  useEffect(() => {
    persistRelatedProductsFirstPage(trimmed, language, query.data?.pages[0]);
  }, [language, query.data?.pages, trimmed]);

  const products = useMemo(() => {
    const rows = query.data?.pages.flatMap((page) => page.data ?? []) ?? [];
    return dedupeCardProductsByTitle(rows);
  }, [query.data?.pages]);

  const showInitialLoading = enabled && products.length === 0 && query.isPending;

  return {
    products,
    loading: showInitialLoading,
    loadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage ?? false,
    loadMore: () => {
      void query.fetchNextPage();
    },
  };
}

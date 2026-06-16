'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { dedupeCardProductsByTitle } from '../../lib/dedupeCardProductsByTitle';
import type { LanguageCode } from '../../lib/language';
import {
  fetchRelatedProducts,
  hasUsableRelatedPayload,
  type RelatedProductRow,
  type RelatedProductsApiResponse,
} from '@/lib/product-pdp/fetch-related-products';
import { RELATED_PRODUCTS_PAGE_SIZE } from '@/lib/product-pdp/related-products.constants';

interface UseRelatedProductsProps {
  productSlug: string;
  language: LanguageCode;
  /** SSR first page — instant carousel on first paint when slug/lang match. */
  initialRelatedProducts?: RelatedProductsApiResponse | null;
  /** Gate fetch for staged PDP rendering. */
  enabled?: boolean;
}

export const RELATED_PRODUCTS_LIMIT = RELATED_PRODUCTS_PAGE_SIZE;

/**
 * Related products for PDP — loads 4 at a time; appends on carousel pagination.
 */
export function useRelatedProducts({
  productSlug,
  language,
  initialRelatedProducts = null,
  enabled = true,
}: UseRelatedProductsProps) {
  const trimmed = productSlug.trim();
  const hasSsrPayload = hasUsableRelatedPayload(initialRelatedProducts);

  const initialRows = useMemo((): RelatedProductRow[] => {
    if (!hasSsrPayload || !initialRelatedProducts) {
      return [];
    }
    return dedupeCardProductsByTitle(initialRelatedProducts.data).slice(0, RELATED_PRODUCTS_PAGE_SIZE);
  }, [hasSsrPayload, initialRelatedProducts]);

  const [products, setProducts] = useState<RelatedProductRow[]>(initialRows);
  const [hasMore, setHasMore] = useState(
    hasSsrPayload ? (initialRelatedProducts?.meta?.hasMore ?? initialRows.length >= RELATED_PRODUCTS_PAGE_SIZE) : true,
  );
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(initialRows.length);
  const fetchGenerationRef = useRef(0);
  const initialFetchDoneRef = useRef(hasSsrPayload);

  const mergeRows = useCallback((existing: RelatedProductRow[], incoming: RelatedProductRow[]) => {
    const seen = new Set(existing.map((row) => row.id));
    const merged = [...existing];
    for (const row of incoming) {
      if (seen.has(row.id)) {
        continue;
      }
      seen.add(row.id);
      merged.push(row);
    }
    return dedupeCardProductsByTitle(merged);
  }, []);

  const applyPageResponse = useCallback(
    (response: RelatedProductsApiResponse, append: boolean) => {
      const rows = dedupeCardProductsByTitle(response.data ?? []);
      setProducts((prev) => (append ? mergeRows(prev, rows) : rows));
      offsetRef.current = append ? offsetRef.current + rows.length : rows.length;
      setHasMore(response.meta?.hasMore ?? rows.length >= RELATED_PRODUCTS_PAGE_SIZE);
    },
    [mergeRows],
  );

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      const generation = fetchGenerationRef.current + 1;
      fetchGenerationRef.current = generation;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const response = await fetchRelatedProducts(
          trimmed,
          language,
          RELATED_PRODUCTS_PAGE_SIZE,
          offset,
        );
        if (generation !== fetchGenerationRef.current) {
          return;
        }
        applyPageResponse(response, append);
      } catch {
        if (generation !== fetchGenerationRef.current) {
          return;
        }
        if (!append) {
          setProducts([]);
        }
        setHasMore(false);
      } finally {
        if (generation === fetchGenerationRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [applyPageResponse, language, trimmed],
  );

  useEffect(() => {
    fetchGenerationRef.current += 1;
    offsetRef.current = initialRows.length;
    initialFetchDoneRef.current = hasSsrPayload;
    setProducts(initialRows);
    setHasMore(
      hasSsrPayload
        ? (initialRelatedProducts?.meta?.hasMore ?? initialRows.length >= RELATED_PRODUCTS_PAGE_SIZE)
        : true,
    );
  }, [hasSsrPayload, initialRelatedProducts?.meta?.hasMore, initialRows, trimmed, language]);

  useEffect(() => {
    if (!enabled || !trimmed || initialFetchDoneRef.current) {
      return;
    }
    initialFetchDoneRef.current = true;
    void fetchPage(0, false);
  }, [enabled, fetchPage, trimmed]);

  const loadMore = useCallback(() => {
    if (!enabled || !trimmed || loading || loadingMore || !hasMore) {
      return;
    }
    void fetchPage(offsetRef.current, true);
  }, [enabled, fetchPage, hasMore, loading, loadingMore, trimmed]);

  const showInitialLoading = enabled && products.length === 0 && loading;

  return {
    products,
    loading: showInitialLoading,
    loadingMore,
    hasMore,
    loadMore,
  };
}

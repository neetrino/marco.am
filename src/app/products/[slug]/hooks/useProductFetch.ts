'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import {
  fetchProductDetail,
  fetchProductVisual,
} from '@/lib/product-pdp/product-pdp-fetchers';
import { PDP_QUERY_GC_TIME_MS, PDP_QUERY_STALE_TIME_MS } from '@/lib/product-pdp/pdp-query-cache';
import { queryKeys } from '@/lib/query-keys';

import { RESERVED_ROUTES, type Product } from '../types';

interface UseProductFetchProps {
  slug: string;
  variantIdFromUrl: string | null;
  /** Cookie language from the server page — keeps SSR + first client paint aligned. */
  serverLanguage: LanguageCode;
  /** Server-rendered `/visual` payload when available (instant gallery on navigation). */
  initialVisual: PdpVisualPayload | null;
  /** SSR full product for same slug/lang — instant detail after refresh when cache hits. */
  initialProduct: Product | null;
}

export function useProductFetch({
  slug,
  variantIdFromUrl: _variantIdFromUrl,
  serverLanguage,
  initialVisual,
  initialProduct,
}: UseProductFetchProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [lang, setLang] = useState<LanguageCode>(() => serverLanguage);

  useEffect(() => {
    setLang(getStoredLanguage());
    const onLanguageUpdate = () => {
      setLang(getStoredLanguage());
    };
    window.addEventListener('language-updated', onLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', onLanguageUpdate);
    };
  }, []);

  useEffect(() => {
    if (!slug) return;
    if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
      router.replace(`/${slug}`);
    }
  }, [slug, router]);

  const enabled = Boolean(slug) && !RESERVED_ROUTES.includes(slug.toLowerCase());

  const detailInitialData =
    initialProduct != null &&
    initialProduct.slug === slug &&
    lang === serverLanguage
      ? initialProduct
      : undefined;

  const visualQuery = useQuery({
    queryKey: queryKeys.productVisual(slug, lang),
    queryFn: () => fetchProductVisual(slug, lang),
    enabled,
    initialData: initialVisual ?? undefined,
    placeholderData: keepPreviousData,
    staleTime: PDP_QUERY_STALE_TIME_MS,
    gcTime: PDP_QUERY_GC_TIME_MS,
    retry: (failureCount, error) => {
      const status =
        error && typeof error === 'object' && 'status' in error ? Number(error.status) : undefined;
      if (status === 404) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.productDetail(slug, lang),
    queryFn: () => fetchProductDetail(slug, lang),
    enabled,
    initialData: detailInitialData,
    placeholderData: keepPreviousData,
    staleTime: PDP_QUERY_STALE_TIME_MS,
    gcTime: PDP_QUERY_GC_TIME_MS,
    retry: (failureCount, error) => {
      const status =
        error && typeof error === 'object' && 'status' in error ? Number(error.status) : undefined;
      if (status === 404) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const fetchProduct = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.productDetail(slug, lang) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.productVisual(slug, lang) });
  };

  const product = detailQuery.data ?? null;
  const productVisual = visualQuery.data ?? null;

  const blockingEmpty =
    !product &&
    !productVisual &&
    visualQuery.isPending &&
    !visualQuery.isError;

  const awaitingDetailShell =
    !product &&
    !productVisual &&
    !visualQuery.isPending &&
    detailQuery.isPending &&
    !detailQuery.isError;

  const detailsPending = Boolean(productVisual && !product && detailQuery.isPending);

  const pdpInitialShell = blockingEmpty || awaitingDetailShell;

  return {
    product,
    productVisual,
    loading: pdpInitialShell,
    blockingEmpty: pdpInitialShell,
    blockingVisualOnly: blockingEmpty,
    awaitingDetailShell,
    detailsPending,
    visualError: visualQuery.isError ? visualQuery.error : null,
    detailError: detailQuery.isError ? detailQuery.error : null,
    fetchProduct,
  };
}

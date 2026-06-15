'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';
import { getErrorHttpStatus } from '@/lib/api-client';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import {
  fetchProductSummary,
  fetchProductDetail,
  fetchProductVisual,
} from '@/lib/product-pdp/product-pdp-fetchers';
import { getPersistedPdpDetail, setPersistedPdpDetail } from '@/lib/product-pdp/pdp-client-persist-cache';
import {
  consumeProductPdpNavigationSeedAnyLanguage,
} from '@/lib/product-pdp/pdp-navigation-seed';
import { PDP_QUERY_GC_TIME_MS, PDP_QUERY_STALE_TIME_MS } from '@/lib/product-pdp/pdp-query-cache';
import { getQueryClient } from '@/lib/query/get-query-client';
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
  const queryClient = getQueryClient();

  const [lang, setLang] = useState<LanguageCode>(() => serverLanguage);
  const [navigationSeedProduct, setNavigationSeedProduct] = useState<Product | null>(
    () => consumeProductPdpNavigationSeedAnyLanguage(slug, serverLanguage),
  );

  useEffect(() => {
    setNavigationSeedProduct((current) => {
      if (current && current.slug === slug) {
        return current;
      }
      return consumeProductPdpNavigationSeedAnyLanguage(slug, lang);
    });
  }, [slug, lang]);

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
      : navigationSeedProduct != null && navigationSeedProduct.slug === slug
        ? navigationSeedProduct
      : getPersistedPdpDetail(slug, lang)
        ? getPersistedPdpDetail(slug, lang) ?? undefined
      : undefined;
  const hasNavigationSeedInitialData =
    navigationSeedProduct != null &&
    navigationSeedProduct.slug === slug &&
    detailInitialData === navigationSeedProduct;

  const visualInitialData =
    initialVisual != null && initialVisual.slug === slug && lang === serverLanguage
      ? initialVisual
      : navigationSeedProduct != null && navigationSeedProduct.slug === slug
        ? {
            id: navigationSeedProduct.id,
            slug: navigationSeedProduct.slug,
            title: navigationSeedProduct.title,
            images: Array.isArray(navigationSeedProduct.media)
              ? navigationSeedProduct.media
                  .filter((item): item is string => typeof item === 'string')
              : [],
            gallery: [],
            labels: [],
            discountPercent:
              navigationSeedProduct.discountBadge?.type === 'percentage'
                ? navigationSeedProduct.discountBadge.value
                : null,
          }
      : undefined;

  const visualQuery = useQuery(
    {
      queryKey: queryKeys.productVisual(slug, lang),
      queryFn: () => fetchProductVisual(slug, lang),
      enabled,
      initialData: visualInitialData,
      placeholderData: keepPreviousData,
      staleTime: PDP_QUERY_STALE_TIME_MS,
      gcTime: PDP_QUERY_GC_TIME_MS,
      retry: (failureCount, error) => {
        if (getErrorHttpStatus(error) === 404) {
          return false;
        }
        return failureCount < 1;
      },
    },
    queryClient,
  );

  const detailQuery = useQuery(
    {
      queryKey: queryKeys.productDetail(slug, lang),
      queryFn: async () => {
        const summary = await fetchProductSummary(slug, lang);
        const hasSeed = navigationSeedProduct != null && navigationSeedProduct.slug === slug;
        const hasVariants = Array.isArray(summary.variants) && summary.variants.length > 0;
        if (hasSeed || hasVariants) {
          return summary;
        }
        return fetchProductDetail(slug, lang);
      },
      enabled,
      initialData: detailInitialData,
      placeholderData:
        hasNavigationSeedInitialData || detailInitialData === initialProduct
          ? undefined
          : keepPreviousData,
      staleTime: PDP_QUERY_STALE_TIME_MS,
      gcTime: PDP_QUERY_GC_TIME_MS,
      initialDataUpdatedAt: hasNavigationSeedInitialData ? 0 : undefined,
      refetchOnMount: hasNavigationSeedInitialData ? 'always' : true,
      retry: (failureCount, error) => {
        if (getErrorHttpStatus(error) === 404) {
          return false;
        }
        return failureCount < 1;
      },
    },
    queryClient,
  );

  useEffect(() => {
    if (!enabled || !slug) {
      return;
    }
    const current = detailQuery.data;
    if (!current || detailQuery.isError) {
      return;
    }
    const hasFullDetails =
      current != null &&
      ((Array.isArray(current.variants) && current.variants.length > 0) ||
        (Array.isArray(current.description) && current.description.length > 0) ||
        (Array.isArray(current.productAttributes) && current.productAttributes.length > 0));
    if (hasFullDetails) {
      return;
    }
    let cancelled = false;
    void fetchProductDetail(slug, lang)
      .then((full) => {
        if (cancelled) {
          return;
        }
        queryClient.setQueryData(queryKeys.productDetail(slug, lang), full);
        setPersistedPdpDetail(slug, lang, full);
      })
      .catch((error: unknown) => {
        if (getErrorHttpStatus(error) === 404) {
          return;
        }
        // Keep summary render when full detail fails; query retries handle hard failures.
      });
    return () => {
      cancelled = true;
    };
  }, [detailQuery.data, detailQuery.isError, enabled, lang, queryClient, slug]);

  useEffect(() => {
    if (!slug || !detailQuery.data) {
      return;
    }
    const data = detailQuery.data;
    const isFull =
      (Array.isArray(data.variants) && data.variants.length > 0) ||
      (Array.isArray(data.description) && data.description.length > 0) ||
      (Array.isArray(data.productAttributes) && data.productAttributes.length > 0);
    if (!isFull) {
      return;
    }
    setPersistedPdpDetail(slug, lang, data);
  }, [detailQuery.data, lang, slug]);

  useEffect(() => {
    if (!navigationSeedProduct) {
      return;
    }
    if (detailQuery.data && detailQuery.data !== navigationSeedProduct) {
      setNavigationSeedProduct(null);
    }
  }, [detailQuery.data, navigationSeedProduct]);

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

  return {
    product,
    productVisual,
    loading: blockingEmpty || awaitingDetailShell,
    /** Full-page skeleton only until gallery visual exists — detail may still stream. */
    blockingEmpty,
    blockingVisualOnly: blockingEmpty,
    awaitingDetailShell,
    detailsPending,
    visualError: visualQuery.isError ? visualQuery.error : null,
    detailError: detailQuery.isError ? detailQuery.error : null,
    fetchProduct,
  };
}

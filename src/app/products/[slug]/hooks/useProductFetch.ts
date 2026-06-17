'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getErrorHttpStatus } from '@/lib/api-client';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import { fetchProductDetail } from '@/lib/product-pdp/product-pdp-fetchers';
import { getPersistedPdpDetail, setPersistedPdpDetail } from '@/lib/product-pdp/pdp-client-persist-cache';
import {
  clearProductPdpNavigationSeedAnyLanguage,
  peekProductPdpNavigationSeedAnyLanguage,
} from '@/lib/product-pdp/pdp-navigation-seed';
import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';
import {
  PDP_QUERY_GC_TIME_MS,
  PDP_QUERY_STALE_TIME_MS,
} from '@/lib/product-pdp/pdp-query-cache';
import {
  isPdpListingShell,
  resolvePdpInstantShell,
} from '@/lib/product-pdp/resolve-pdp-listing-shell';
import { getQueryClient } from '@/lib/query/get-query-client';
import { queryKeys } from '@/lib/query-keys';

import { RESERVED_ROUTES, type Product } from '../types';

interface UseProductFetchProps {
  slug: string;
  serverLanguage: LanguageCode;
  initialProduct: Product | null;
}

export function useProductFetch({
  slug,
  serverLanguage,
  initialProduct,
}: UseProductFetchProps) {
  const router = useRouter();
  const queryClient = getQueryClient();

  const [lang, setLang] = useState<LanguageCode>(() => serverLanguage);
  const [navigationSeedProduct, setNavigationSeedProduct] = useState<Product | null>(
    () => peekProductPdpNavigationSeedAnyLanguage(slug, serverLanguage),
  );

  useEffect(() => {
    setNavigationSeedProduct((current) => {
      if (current && current.slug === slug) {
        return current;
      }
      return peekProductPdpNavigationSeedAnyLanguage(slug, lang);
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
  const normalizedSlug = normalizePdpSlug(slug);
  const instantShell = enabled && normalizedSlug
    ? resolvePdpInstantShell(normalizedSlug, lang, queryClient)
    : null;

  const detailInitialData = (() => {
    if (
      initialProduct != null &&
      initialProduct.slug === slug &&
      lang === serverLanguage &&
      !isPdpListingShell(initialProduct)
    ) {
      return initialProduct;
    }

    const cached = queryClient.getQueryData<Product>(queryKeys.productDetail(slug, lang));
    if (cached && !isPdpListingShell(cached)) {
      return cached;
    }

    return instantShell ?? getPersistedPdpDetail(slug, lang) ?? undefined;
  })();

  const isShellInitial = detailInitialData != null && isPdpListingShell(detailInitialData);
  const staleTime = isShellInitial ? 0 : PDP_QUERY_STALE_TIME_MS;

  useLayoutEffect(() => {
    if (
      initialProduct == null ||
      initialProduct.slug !== slug ||
      isPdpListingShell(initialProduct)
    ) {
      return;
    }
    queryClient.setQueryData(queryKeys.productDetail(slug, serverLanguage), initialProduct);
  }, [initialProduct, queryClient, serverLanguage, slug]);

  const detailQuery = useQuery(
    {
      queryKey: queryKeys.productDetail(slug, lang),
      queryFn: () => fetchProductDetail(slug, lang),
      enabled,
      initialData: detailInitialData,
      placeholderData: keepPreviousData,
      staleTime,
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

  useEffect(() => {
    const data = detailQuery.data;
    if (!data || isPdpListingShell(data)) {
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
      clearProductPdpNavigationSeedAnyLanguage(slug);
    }
  }, [detailQuery.data, navigationSeedProduct, slug]);

  const product = detailQuery.data ?? instantShell;
  const isListingShell = product != null && isPdpListingShell(product);
  const isInstantShellPaint = instantShell != null && isListingShell && product === instantShell;
  const blockingEmpty = !product && detailQuery.isPending && !detailQuery.isError;
  const detailsPending = isListingShell;

  const fetchProduct = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.productDetail(slug, lang) });
  };

  return {
    product,
    instantShell,
    isInstantShellPaint,
    loading: blockingEmpty,
    blockingEmpty,
    detailsPending,
    isListingShell,
    detailError: detailQuery.isError ? detailQuery.error : null,
    fetchProduct,
  };
}

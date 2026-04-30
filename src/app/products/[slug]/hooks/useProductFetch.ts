'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { getStoredLanguage, type LanguageCode } from '../../../../lib/language';
import { queryKeys } from '../../../../lib/query-keys';
import { RESERVED_ROUTES } from '../types';
import type { Product } from '../types';

interface UseProductFetchProps {
  slug: string;
  variantIdFromUrl: string | null;
}

async function fetchProductDetail(slug: string, lang: LanguageCode): Promise<Product> {
  try {
    return await apiClient.get<Product>(`/api/v1/products/${slug}`, {
      params: { lang },
    });
  } catch (error: unknown) {
    const errorStatus =
      error && typeof error === 'object' && 'status' in error ? Number(error.status) : undefined;
    if (errorStatus === 404 && lang !== 'en') {
      return apiClient.get<Product>(`/api/v1/products/${slug}`, {
        params: { lang: 'en' },
      });
    }
    throw error;
  }
}

export function useProductFetch({
  slug,
  variantIdFromUrl: _variantIdFromUrl,
}: UseProductFetchProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [lang, setLang] = useState<LanguageCode>(() =>
    typeof window !== 'undefined' ? getStoredLanguage() : 'en',
  );

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

  const query = useQuery({
    queryKey: queryKeys.productDetail(slug, lang),
    queryFn: () => fetchProductDetail(slug, lang),
    enabled,
    staleTime: 120_000,
    retry: (failureCount, error) => {
      const status =
        error && typeof error === 'object' && 'status' in error ? Number(error.status) : undefined;
      if (status === 404) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const fetchProduct = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.productDetail(slug, lang) });

  return {
    product: query.data ?? null,
    loading: query.isPending || query.isFetching,
    fetchProduct,
  };
}

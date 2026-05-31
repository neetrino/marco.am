'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchCompareProductIds } from '@/lib/compare/compare-client';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';

import { registerWishlistCompareQuerySync } from './wishlist-compare-query-sync';

const MEMBERSHIP_IDS_STALE_MS = 60_000;

/** Shared compare product IDs — one network request for all product cards on a page. */
export function useCompareProductIds() {
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState<LanguageCode>(() => getStoredLanguage());

  useEffect(() => {
    registerWishlistCompareQuerySync(queryClient);
  }, [queryClient]);

  useEffect(() => {
    const onLang = () => setLanguage(getStoredLanguage());
    window.addEventListener('language-updated', onLang);
    return () => window.removeEventListener('language-updated', onLang);
  }, []);

  const queryKey = queryKeys.compareProductIds(language);
  const query = useQuery({
    queryKey,
    queryFn: () => fetchCompareProductIds(language),
    staleTime: MEMBERSHIP_IDS_STALE_MS,
  });

  return {
    ids: query.data ?? [],
    language,
    queryKey,
  };
}

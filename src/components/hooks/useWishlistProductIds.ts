'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchWishlistProductIds } from '@/lib/wishlist/wishlist-client';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';

import { registerWishlistCompareQuerySync } from './wishlist-compare-query-sync';

const MEMBERSHIP_IDS_STALE_MS = 60_000;

type UseWishlistProductIdsOptions = {
  /** When false, skips the network fetch until re-enabled (header defer path). */
  queryEnabled?: boolean;
};

/** Shared wishlist product IDs — one network request for all product cards on a page. */
export function useWishlistProductIds(options?: UseWishlistProductIdsOptions) {
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

  const queryKey = queryKeys.wishlistProductIds(language);
  const query = useQuery({
    queryKey,
    queryFn: () => fetchWishlistProductIds(language),
    staleTime: MEMBERSHIP_IDS_STALE_MS,
    enabled: options?.queryEnabled !== false,
  });

  return {
    ids: query.data ?? [],
    language,
    queryKey,
  };
}

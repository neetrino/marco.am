'use client';

import { useLayoutEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { LanguageCode } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';

import type { Product } from './types';

type ProductPdpDetailCacheSeedProps = {
  readonly slug: string;
  readonly language: LanguageCode;
  readonly product: Product;
};

/**
 * Streams SSR detail into React Query after visual first paint — no full-page skeleton wait.
 */
export function ProductPdpDetailCacheSeed({
  slug,
  language,
  product,
}: ProductPdpDetailCacheSeedProps) {
  const queryClient = useQueryClient();

  useLayoutEffect(() => {
    queryClient.setQueryData(queryKeys.productDetail(slug, language), product);
  }, [queryClient, slug, language, product]);

  return null;
}

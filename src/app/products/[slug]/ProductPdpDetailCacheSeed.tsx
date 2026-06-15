'use client';

import { useLayoutEffect } from 'react';

import type { LanguageCode } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';
import { getQueryClient } from '@/lib/query/get-query-client';

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
  useLayoutEffect(() => {
    getQueryClient().setQueryData(queryKeys.productDetail(slug, language), product);
  }, [slug, language, product]);

  return null;
}

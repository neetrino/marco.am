'use client';

import { useLayoutEffect } from 'react';

import type { LanguageCode } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';
import { getQueryClient } from '@/lib/query/get-query-client';

import type { Product } from './types';

type ProductPdpQuerySeedProps = {
  readonly slug: string;
  readonly language: LanguageCode;
  readonly product: Product | null;
};

/** Streams the SSR detail payload into React Query without remounting the layout PDP shell. */
export function ProductPdpQuerySeed({
  slug,
  language,
  product,
}: ProductPdpQuerySeedProps) {
  useLayoutEffect(() => {
    if (product) {
      getQueryClient().setQueryData(queryKeys.productDetail(slug, language), product);
    }
  }, [slug, language, product]);

  return null;
}

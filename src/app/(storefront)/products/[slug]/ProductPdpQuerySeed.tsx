'use client';

import { useLayoutEffect } from 'react';

import type { LanguageCode } from '@/lib/language';
import type { RelatedProductsApiResponse } from '@/lib/product-pdp/fetch-related-products';
import { seedRelatedProductsQuery } from '@/lib/product-pdp/pdp-related-query-seed';
import { queryKeys } from '@/lib/query-keys';
import { getQueryClient } from '@/lib/query/get-query-client';

import type { Product } from './types';

type ProductPdpQuerySeedProps = {
  readonly slug: string;
  readonly language: LanguageCode;
  readonly product: Product | null;
  readonly relatedProducts?: RelatedProductsApiResponse | null;
};

/** Streams SSR PDP payloads into React Query without remounting the layout shell. */
export function ProductPdpQuerySeed({
  slug,
  language,
  product,
  relatedProducts = null,
}: ProductPdpQuerySeedProps) {
  useLayoutEffect(() => {
    const queryClient = getQueryClient();
    if (product) {
      queryClient.setQueryData(queryKeys.productDetail(slug, language), product);
    }
    if (relatedProducts) {
      seedRelatedProductsQuery(queryClient, slug, language, relatedProducts);
    }
  }, [slug, language, product, relatedProducts]);

  return null;
}

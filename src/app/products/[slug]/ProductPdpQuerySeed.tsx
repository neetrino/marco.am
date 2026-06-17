'use client';

import { useLayoutEffect } from 'react';

import type { LanguageCode } from '@/lib/language';
import type { RelatedProductsApiResponse } from '@/lib/product-pdp/fetch-related-products';
import { RELATED_PRODUCTS_PAGE_SIZE } from '@/lib/product-pdp/related-products.constants';
import { queryKeys } from '@/lib/query-keys';
import { getQueryClient } from '@/lib/query/get-query-client';

import type { Product } from './types';

type ProductPdpQuerySeedProps = {
  readonly slug: string;
  readonly language: LanguageCode;
  readonly product: Product | null;
  readonly related: RelatedProductsApiResponse | null;
};

/** Streams SSR payloads into React Query without remounting the layout PDP shell. */
export function ProductPdpQuerySeed({
  slug,
  language,
  product,
  related,
}: ProductPdpQuerySeedProps) {
  useLayoutEffect(() => {
    const queryClient = getQueryClient();
    if (product) {
      queryClient.setQueryData(queryKeys.productDetail(slug, language), product);
    }
    if (related) {
      queryClient.setQueryData(
        queryKeys.relatedProducts(slug, language, RELATED_PRODUCTS_PAGE_SIZE),
        related,
      );
    }
  }, [slug, language, product, related]);

  return null;
}

'use client';

import { useLayoutEffect } from 'react';

import type { LanguageCode } from '@/lib/language';
import type { RelatedProductsApiResponse } from '@/lib/product-pdp/fetch-related-products';
import { RELATED_PRODUCTS_FETCH_LIMIT } from '@/lib/product-pdp/related-products.constants';
import { queryKeys } from '@/lib/query-keys';
import { getQueryClient } from '@/lib/query/get-query-client';

type ProductPdpRelatedCacheSeedProps = {
  readonly slug: string;
  readonly language: LanguageCode;
  readonly related: RelatedProductsApiResponse;
};

/**
 * Streams SSR related rows into React Query — carousel can paint before client fetch.
 */
export function ProductPdpRelatedCacheSeed({
  slug,
  language,
  related,
}: ProductPdpRelatedCacheSeedProps) {
  useLayoutEffect(() => {
    getQueryClient().setQueryData(
      queryKeys.relatedProducts(slug, language, RELATED_PRODUCTS_FETCH_LIMIT),
      related,
    );
  }, [slug, language, related]);

  return null;
}

import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { LanguageCode } from '@/lib/language';
import {
  getPersistedPdpRelated,
  setPersistedPdpRelated,
} from '@/lib/product-pdp/pdp-client-persist-cache';
import {
  hasUsableRelatedPayload,
  type RelatedProductsApiResponse,
} from '@/lib/product-pdp/fetch-related-products';
import { RELATED_PRODUCTS_PAGE_SIZE } from '@/lib/product-pdp/related-products.constants';
import { queryKeys } from '@/lib/query-keys';

export type RelatedProductsInfiniteData = InfiniteData<
  RelatedProductsApiResponse,
  number
>;

function toInfiniteSeed(
  page: RelatedProductsApiResponse,
): RelatedProductsInfiniteData {
  return { pages: [page], pageParams: [0] };
}

export function readRelatedProductsQuerySeed(
  queryClient: QueryClient,
  slug: string,
  lang: LanguageCode,
  limit = RELATED_PRODUCTS_PAGE_SIZE,
): RelatedProductsInfiniteData | undefined {
  const key = queryKeys.relatedProducts(slug, lang, limit);
  const cached = queryClient.getQueryData<RelatedProductsInfiniteData>(key);
  if (cached?.pages?.length) {
    return cached;
  }

  const persisted = getPersistedPdpRelated(slug, lang, limit);
  if (hasUsableRelatedPayload(persisted)) {
    return toInfiniteSeed(persisted);
  }

  return undefined;
}

export function seedRelatedProductsQuery(
  queryClient: QueryClient,
  slug: string,
  lang: LanguageCode,
  page: RelatedProductsApiResponse,
  limit = RELATED_PRODUCTS_PAGE_SIZE,
): void {
  if (!hasUsableRelatedPayload(page)) {
    return;
  }

  queryClient.setQueryData(
    queryKeys.relatedProducts(slug, lang, limit),
    toInfiniteSeed(page),
  );
}

export function persistRelatedProductsFirstPage(
  slug: string,
  lang: LanguageCode,
  page: RelatedProductsApiResponse | undefined,
  limit = RELATED_PRODUCTS_PAGE_SIZE,
): void {
  if (!page || !hasUsableRelatedPayload(page)) {
    return;
  }
  setPersistedPdpRelated(slug, lang, limit, page);
}

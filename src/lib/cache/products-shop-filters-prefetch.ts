import { cache } from 'react';
import {
  getProductsFiltersCached,
  searchParamsRecordToUrlSearchParams,
} from '@/lib/cache/products-filters-redis';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { buildProductsFiltersClientKey } from '@/lib/products-filters-client-key';
import { buildTechnicalFilterQuerySignature } from '@/lib/services/products-technical-filters';
import type { ProductsPageSearchParams } from '@/app/products/products-page-search-params';

/** Stable key aligned with `ProductsFiltersProvider.filtersClientKey` (server language). */
export function buildProductsShopFiltersInitialKey(
  raw: ProductsPageSearchParams,
  ctx: ProductsShopListingServerContext,
): string {
  const technicalFilterSignature = buildTechnicalFilterQuerySignature(
    searchParamsRecordToUrlSearchParams(raw),
  );
  const { params, language } = ctx;
  return buildProductsFiltersClientKey({
    category: params.category,
    search: params.search,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    filter: params.filter,
    language,
    technicalFilterSignature,
  });
}

/** Deduped per-request PLP facet prefetch (Redis read-through). */
export const prefetchProductsShopFilters = cache(
  async (raw: ProductsPageSearchParams, ctx: ProductsShopListingServerContext) => {
    return getProductsFiltersCached({
      category: ctx.params.category?.trim() || undefined,
      search: ctx.params.search?.trim() || undefined,
      filter: ctx.params.filter?.trim() || undefined,
      minPrice: ctx.filtersMinPrice,
      maxPrice: ctx.filtersMaxPrice,
      lang: ctx.language,
      includeCategories: true,
      rawSearchParams: raw,
    });
  },
);

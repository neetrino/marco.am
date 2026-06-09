import { cache } from 'react';
import {
  getProductsFiltersCached,
  searchParamsRecordToUrlSearchParams,
} from '@/lib/cache/products-filters-redis';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { buildProductsFiltersScopeKeyFromSearchParams } from '@/lib/products-filters-client-key';
import type { ProductsPageSearchParams } from '@/app/products/products-page-search-params';

/** Stable key aligned with `ProductsFiltersProvider` facet scope (server language). */
export function buildProductsShopFiltersInitialKey(
  raw: ProductsPageSearchParams,
  ctx: ProductsShopListingServerContext,
): string {
  return buildProductsFiltersScopeKeyFromSearchParams(
    searchParamsRecordToUrlSearchParams(raw),
    ctx.language,
  );
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

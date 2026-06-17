import { searchParamsRecordToUrlSearchParams } from '@/lib/cache/products-filters-redis';
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

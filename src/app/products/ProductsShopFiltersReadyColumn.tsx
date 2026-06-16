import {
  buildProductsShopFiltersInitialKey,
  prefetchProductsShopFilters,
} from '@/lib/cache/products-shop-filters-prefetch';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import type { ProductsPageSearchParams } from './products-page-search-params';
import { ProductsShopFiltersColumn } from './ProductsShopFiltersColumn';

type ProductsShopFiltersReadyColumnProps = {
  readonly raw: ProductsPageSearchParams;
  readonly ctx: ProductsShopListingServerContext;
};

/** Prefetches facet payload on the server, then mounts the filter column with hydrated data. */
export async function ProductsShopFiltersReadyColumn({
  raw,
  ctx,
}: ProductsShopFiltersReadyColumnProps) {
  const filtersPayload = await prefetchProductsShopFilters(raw, ctx);

  return (
    <ProductsShopFiltersColumn
      language={ctx.language}
      params={ctx.params}
      initialFiltersData={filtersPayload}
      initialFiltersKey={buildProductsShopFiltersInitialKey(raw, ctx)}
    />
  );
}

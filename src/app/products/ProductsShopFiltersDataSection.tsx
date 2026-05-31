import {
  buildProductsShopFiltersInitialKey,
  prefetchProductsShopFilters,
} from '@/lib/cache/products-shop-filters-prefetch';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import type { ProductsPageSearchParams } from './products-page-search-params';
import { ProductsFiltersServerHydration } from '@/components/ProductsFiltersProvider';

type ProductsShopFiltersDataSectionProps = {
  readonly raw: ProductsPageSearchParams;
  readonly ctx: ProductsShopListingServerContext;
};

/** Streams prefetched facet payload into the mounted filter provider (column shell paints first). */
export async function ProductsShopFiltersDataSection({
  raw,
  ctx,
}: ProductsShopFiltersDataSectionProps) {
  const filtersPayload = await prefetchProductsShopFilters(raw, ctx);

  return (
    <ProductsFiltersServerHydration
      initialFiltersData={filtersPayload}
      initialFiltersKey={buildProductsShopFiltersInitialKey(raw, ctx)}
    />
  );
}

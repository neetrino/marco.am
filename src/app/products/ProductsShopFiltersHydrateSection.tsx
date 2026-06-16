import {
  buildProductsShopFiltersInitialKey,
  prefetchProductsShopFilters,
} from '@/lib/cache/products-shop-filters-prefetch';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { ProductsFiltersServerHydration } from '@/components/ProductsFiltersProvider';
import type { ProductsPageSearchParams } from './products-page-search-params';

type ProductsShopFiltersHydrateSectionProps = {
  readonly raw: ProductsPageSearchParams;
  readonly ctx: ProductsShopListingServerContext;
};

/** Streams scoped/base facet payload into the mounted filter provider. */
export async function ProductsShopFiltersHydrateSection({
  raw,
  ctx,
}: ProductsShopFiltersHydrateSectionProps) {
  const filtersPayload = await prefetchProductsShopFilters(raw, ctx);

  return (
    <ProductsFiltersServerHydration
      initialFiltersData={filtersPayload}
      initialFiltersKey={buildProductsShopFiltersInitialKey(raw, ctx)}
    />
  );
}

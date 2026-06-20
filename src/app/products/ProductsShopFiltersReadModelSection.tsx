import { buildProductsShopFiltersInitialKey } from '@/lib/cache/products-shop-filters-prefetch';
import { searchParamsRecordToUrlSearchParams } from '@/lib/search-params-record';
import { ProductsFiltersFullHydration } from '@/components/ProductsFiltersProvider';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { getProductsPlpReadModelFilters } from '@/lib/read-model/products-plp-read-model';
import { parseTechnicalSpecFiltersFromSearchParams } from '@/lib/services/products-technical-filters';
import type { ProductsPageSearchParams } from './products-page-search-params';

type ProductsShopFiltersReadModelSectionProps = {
  readonly raw: ProductsPageSearchParams;
  readonly ctx: ProductsShopListingServerContext;
};

/** Streams all PLP sidebar facets (live-aggregated from `product_listing_rows`) into the filter provider. */
export async function ProductsShopFiltersReadModelSection({
  raw,
  ctx,
}: ProductsShopFiltersReadModelSectionProps) {
  const technicalSpecs = parseTechnicalSpecFiltersFromSearchParams(
    searchParamsRecordToUrlSearchParams(raw),
  );
  const filters = await getProductsPlpReadModelFilters({
    lang: ctx.language,
    category: ctx.params.category?.trim() || undefined,
    search: ctx.params.search?.trim() || undefined,
    filter: ctx.params.filter?.trim() || undefined,
    minPrice: ctx.params.minPrice?.trim() || undefined,
    maxPrice: ctx.params.maxPrice?.trim() || undefined,
    colors: ctx.params.colors?.trim() || undefined,
    sizes: ctx.params.sizes?.trim() || undefined,
    brand: ctx.params.brand?.trim() || undefined,
    pricePresence: ctx.params.pricePresence?.trim() || undefined,
    technicalSpecs,
  });

  return (
    <ProductsFiltersFullHydration
      filters={filters}
      filtersKey={buildProductsShopFiltersInitialKey(raw, ctx)}
    />
  );
}

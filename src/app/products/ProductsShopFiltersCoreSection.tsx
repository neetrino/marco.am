import { buildProductsShopFiltersInitialKey } from '@/lib/cache/products-shop-filters-prefetch';
import {
  getProductsFiltersCoreCached,
  searchParamsRecordToUrlSearchParams,
} from '@/lib/cache/products-filters-redis';
import { isUnscopedShopFiltersScope } from '@/lib/cache/products-filters-scope';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { parseTechnicalSpecFiltersFromSearchParams } from '@/lib/services/products-technical-filters';
import { ProductsFiltersCoreHydration } from '@/components/ProductsFiltersProvider';
import type { ProductsPageSearchParams } from './products-page-search-params';

type ProductsShopFiltersCoreSectionProps = {
  readonly raw: ProductsPageSearchParams;
  readonly ctx: ProductsShopListingServerContext;
};

/** Streams brands + price (+ scoped categories when filtered) into the filter provider. */
export async function ProductsShopFiltersCoreSection({
  raw,
  ctx,
}: ProductsShopFiltersCoreSectionProps) {
  const technicalSpecs = parseTechnicalSpecFiltersFromSearchParams(
    searchParamsRecordToUrlSearchParams(raw),
  );
  const scope = {
    category: ctx.params.category?.trim() || undefined,
    search: ctx.params.search?.trim() || undefined,
    filter: ctx.params.filter?.trim() || undefined,
    minPrice: ctx.filtersMinPrice,
    maxPrice: ctx.filtersMaxPrice,
    technicalSpecs,
  };

  const core = await getProductsFiltersCoreCached({
    category: scope.category,
    search: scope.search,
    filter: scope.filter,
    minPrice: scope.minPrice,
    maxPrice: scope.maxPrice,
    lang: ctx.language,
    technicalSpecs,
    rawSearchParams: raw,
  });

  const filtersKey = buildProductsShopFiltersInitialKey(raw, ctx);
  const includeScopedCategories = !isUnscopedShopFiltersScope(scope);

  return (
    <ProductsFiltersCoreHydration
      core={core}
      filtersKey={filtersKey}
      includeScopedCategories={includeScopedCategories}
    />
  );
}

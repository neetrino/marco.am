import {
  buildProductsShopFiltersInitialKey,
  prefetchProductsShopFilters,
} from '@/lib/cache/products-shop-filters-prefetch';
import { getShopFiltersInstantShell } from '@/lib/services/shop-filters-instant-shell.service';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import type { ProductsPageSearchParams } from './products-page-search-params';
import { ProductsShopFiltersColumn } from './ProductsShopFiltersColumn';
import { ProductsShopFiltersHydrateSection } from './ProductsShopFiltersHydrateSection';
import { Suspense } from 'react';

type ProductsShopFiltersReadyColumnProps = {
  readonly raw: ProductsPageSearchParams;
  readonly ctx: ProductsShopListingServerContext;
};

/** Instant shell from navigation cache; full/scoped facets stream in via Suspense. */
export async function ProductsShopFiltersReadyColumn({
  raw,
  ctx,
}: ProductsShopFiltersReadyColumnProps) {
  const shell = await getShopFiltersInstantShell(ctx.language);

  return (
    <ProductsShopFiltersColumn
      language={ctx.language}
      params={ctx.params}
      initialShellData={shell}
    >
      <Suspense fallback={null}>
        <ProductsShopFiltersHydrateSection raw={raw} ctx={ctx} />
      </Suspense>
    </ProductsShopFiltersColumn>
  );
}

import { Suspense } from 'react';
import {
  ProductsShopFiltersColumn,
  productsShopFiltersColumnSkeletonAria,
} from './ProductsShopFiltersColumn';
import { resolveProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import type { ProductsPageSearchParams } from './products-page-search-params';
import { ProductsShopListingSection } from './ProductsShopListingSection';
import { ProductsShopLoadingSkeleton } from './ProductsShopLoadingSkeleton';

type ProductsShopFiltersSectionProps = {
  readonly searchParams: Promise<ProductsPageSearchParams>;
};

async function ProductsShopFiltersSection({ searchParams }: ProductsShopFiltersSectionProps) {
  const raw = await searchParams;
  const ctx = await resolveProductsShopListingServerContext(raw);

  return (
    <ProductsShopFiltersColumn
      raw={raw}
      language={ctx.language}
      params={ctx.params}
      filtersMinPrice={ctx.filtersMinPrice}
      filtersMaxPrice={ctx.filtersMaxPrice}
    />
  );
}

interface ProductsShopStreamedSectionProps {
  readonly searchParams: Promise<ProductsPageSearchParams>;
}

export function ProductsShopStreamedSection({ searchParams }: ProductsShopStreamedSectionProps) {
  return (
    <div className="marco-header-container flex flex-col min-[744px]:flex-row min-[744px]:gap-5 xl:gap-8">
      <Suspense fallback={productsShopFiltersColumnSkeletonAria()}>
        <ProductsShopFiltersSection searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<ProductsShopLoadingSkeleton variant="grid" />}>
        <ProductsShopListingSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

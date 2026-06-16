import { Suspense } from 'react';
import { resolveProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { ProductsShopFiltersReadyColumn } from './ProductsShopFiltersReadyColumn';
import { ProductsShopFiltersColumnSkeleton } from './ProductsShopFiltersColumnSkeleton';
import type { ProductsPageSearchParams } from './products-page-search-params';
import { ProductsShopListingCacheFallback } from './ProductsShopListingCacheFallback';
import { ProductsShopListingSection } from './ProductsShopListingSection';

interface ProductsShopStreamedSectionProps {
  readonly raw: ProductsPageSearchParams;
}

/**
 * Filter column and product grid stream in parallel; facets arrive with SSR data (no client cold fetch).
 */
export async function ProductsShopStreamedSection({ raw }: ProductsShopStreamedSectionProps) {
  const ctx = await resolveProductsShopListingServerContext(raw);

  return (
    <div className="marco-header-container flex flex-col min-[744px]:flex-row min-[744px]:gap-5 xl:gap-8">
      <Suspense fallback={<ProductsShopFiltersColumnSkeleton language={ctx.language} />}>
        <ProductsShopFiltersReadyColumn raw={raw} ctx={ctx} />
      </Suspense>

      <Suspense fallback={<ProductsShopListingCacheFallback />}>
        <ProductsShopListingSection raw={raw} ctx={ctx} />
      </Suspense>
    </div>
  );
}

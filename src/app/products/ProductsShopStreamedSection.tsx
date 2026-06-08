import { Suspense } from 'react';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { ProductsShopFiltersColumn } from './ProductsShopFiltersColumn';
import { ProductsShopFiltersDataSection } from './ProductsShopFiltersDataSection';
import type { ProductsPageSearchParams } from './products-page-search-params';
import { ProductsShopListingCacheFallback } from './ProductsShopListingCacheFallback';
import { ProductsShopListingSection } from './ProductsShopListingSection';
interface ProductsShopStreamedSectionProps {
  readonly raw: ProductsPageSearchParams;
  readonly ctx: ProductsShopListingServerContext;
}

/**
 * Filter shell paints immediately; facet payload and listing grid stream in parallel.
 */
export function ProductsShopStreamedSection({ raw, ctx }: ProductsShopStreamedSectionProps) {
  return (
    <div className="marco-header-container flex flex-col min-[744px]:flex-row min-[744px]:gap-5 xl:gap-8">
      <ProductsShopFiltersColumn
        language={ctx.language}
        params={ctx.params}
        awaitServerHydration
      >
        <Suspense fallback={null}>
          <ProductsShopFiltersDataSection raw={raw} ctx={ctx} />
        </Suspense>
      </ProductsShopFiltersColumn>

      <Suspense fallback={<ProductsShopListingCacheFallback />}>
        <ProductsShopListingSection raw={raw} />
      </Suspense>
    </div>
  );
}

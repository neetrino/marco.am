import { Suspense } from 'react';
import { resolveProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { ProductsShopFiltersColumn } from './ProductsShopFiltersColumn';
import { ProductsShopFiltersDataSection } from './ProductsShopFiltersDataSection';
import { ProductsShopFiltersPrefetch } from './ProductsShopFiltersPrefetch';
import type { ProductsPageSearchParams } from './products-page-search-params';
import { ProductsShopListingCacheFallback } from './ProductsShopListingCacheFallback';
import { ProductsShopListingSection } from './ProductsShopListingSection';

interface ProductsShopStreamedSectionProps {
  readonly raw: ProductsPageSearchParams;
}

/**
 * Filter shell paints after URL context resolves; facet payload and listing grid stream in parallel.
 */
export async function ProductsShopStreamedSection({ raw }: ProductsShopStreamedSectionProps) {
  const ctx = await resolveProductsShopListingServerContext(raw);

  return (
    <>
      <Suspense fallback={null}>
        <ProductsShopFiltersPrefetch raw={raw} ctx={ctx} />
      </Suspense>
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
          <ProductsShopListingSection raw={raw} ctx={ctx} />
        </Suspense>
      </div>
    </>
  );
}

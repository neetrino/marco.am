import { Suspense } from 'react';
import { resolveProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { ProductsShopFiltersColumn } from './ProductsShopFiltersColumn';
import { ProductsShopFiltersReadModelSection } from './ProductsShopFiltersReadModelSection';
import type { ProductsPageSearchParams } from './products-page-search-params';
import { ProductsShopListingCacheFallback } from './ProductsShopListingCacheFallback';
import { ProductsShopListingSection } from './ProductsShopListingSection';

interface ProductsShopStreamedSectionProps {
  readonly raw: ProductsPageSearchParams;
}

/**
 * Filter column mounts immediately; category tree + core stream in parallel with the product grid.
 */
export async function ProductsShopStreamedSection({ raw }: ProductsShopStreamedSectionProps) {
  const ctx = await resolveProductsShopListingServerContext(raw);

  return (
    <div className="marco-header-container flex flex-col min-[744px]:flex-row min-[744px]:gap-5 xl:gap-8">
      <ProductsShopFiltersColumn language={ctx.language} params={ctx.params}>
        <Suspense fallback={null}>
          <ProductsShopFiltersReadModelSection raw={raw} ctx={ctx} />
        </Suspense>
      </ProductsShopFiltersColumn>

      <Suspense fallback={<ProductsShopListingCacheFallback />}>
        <ProductsShopListingSection raw={raw} ctx={ctx} />
      </Suspense>
    </div>
  );
}

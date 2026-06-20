'use client';

import { useMemo } from 'react';
import { ProductsShopPageTitle } from '@/components/ProductsHeader';
import { resolveProductsShopListingClientContext } from '@/lib/products-shop-listing-client-context';
import { useTranslation } from '@/lib/i18n-client';
import { useShopProductsListingSearchParams } from '@/lib/use-shop-products-listing-search-params';
import { ProductsShopClientListing } from './ProductsShopClientListing';
import { ProductsShopFiltersColumn } from './ProductsShopFiltersColumn';

/** Client PLP body — filters + listing without server cookies / RSC data fetch. */
export function ProductsShopClientSection() {
  const searchParams = useShopProductsListingSearchParams();
  const { lang } = useTranslation();
  const ctx = useMemo(
    () => resolveProductsShopListingClientContext(searchParams, lang),
    [lang, searchParams],
  );

  return (
    <div className="marco-header-container pt-[58px]">
      <div className="flex flex-col min-[744px]:flex-row min-[744px]:gap-5 xl:gap-8">
        <ProductsShopFiltersColumn language={ctx.language} params={ctx.params} />
        <div className="min-w-0 flex-1 w-full min-[744px]:w-auto">
          <div className="pb-2 min-[744px]:hidden">
            <ProductsShopPageTitle />
          </div>
          <ProductsShopClientListing />
        </div>
      </div>
    </div>
  );
}

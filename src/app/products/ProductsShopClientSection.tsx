'use client';

import { useMemo } from 'react';

import { buildProductsFiltersScopeKeyFromSearchParams } from '@/lib/products-filters-client-key';
import { resolveProductsShopListingClientContext } from '@/lib/products-shop-listing-client-context';
import { readShopFiltersCache } from '@/lib/shop-products-filters-client-cache';
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
  const filtersKey = useMemo(
    () => buildProductsFiltersScopeKeyFromSearchParams(searchParams, lang),
    [lang, searchParams],
  );
  const initialFiltersData = useMemo(
    () => readShopFiltersCache(filtersKey),
    [filtersKey],
  );

  return (
    <div className="marco-header-container flex flex-col min-[744px]:flex-row min-[744px]:gap-5 xl:gap-8">
      <ProductsShopFiltersColumn
        language={ctx.language}
        params={ctx.params}
        initialFiltersData={initialFiltersData}
        initialFiltersKey={filtersKey}
      />
      <ProductsShopClientListing />
    </div>
  );
}

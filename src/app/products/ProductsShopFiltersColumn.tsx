'use client';

import type { ReactNode } from 'react';
import { PriceFilter } from '@/components/PriceFilter';
import { BrandFilter } from '@/components/BrandFilter';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ColorFilter } from '@/components/ColorFilter';
import { SizeFilter } from '@/components/SizeFilter';
import { ShopAttributeFacetsFilter } from '@/components/ShopAttributeFacetsFilter';
import { ProductsFiltersProvider } from '@/components/ProductsFiltersProvider';
import { MobileFiltersDrawer } from '@/components/MobileFiltersDrawer';
import { ProductsShopPageTitle } from '@/components/ProductsHeader';
import type { LanguageCode } from '@/lib/language';
import { MOBILE_FILTERS_EVENT } from '@/lib/events';

export type ProductsShopFiltersColumnProps = {
  readonly language: LanguageCode;
  readonly params: {
    category?: string;
    search?: string;
    filter?: string;
    minPrice?: string;
    maxPrice?: string;
    limit?: string;
  };
  readonly children?: ReactNode;
};

/** Sidebar + mobile filter drawer; facet data streams in via server children + client extended fetch. */
export function ProductsShopFiltersColumn({
  language,
  params,
  children,
}: ProductsShopFiltersColumnProps) {
  return (
    <ProductsFiltersProvider
      category={params.category}
      search={params.search}
      filter={params.filter}
      minPrice={params.minPrice}
      maxPrice={params.maxPrice}
      language={language}
    >
      {children}
      <aside className="hidden w-[16rem] shrink-0 bg-white dark:bg-[var(--app-bg)] min-[744px]:sticky min-[744px]:top-4 min-[744px]:z-10 min-[744px]:self-start min-[744px]:block xl:w-[20rem]">
        <div className="border-r border-solid border-[#e2e8f0] dark:border-white/20 pb-4 min-[744px]:pl-0 min-[744px]:pr-3 xl:pb-6 xl:pr-6">
          <div className="mb-4 lg:mb-5 xl:mb-6">
            <ProductsShopPageTitle />
          </div>
          <CategoryFilter
            category={params.category}
            search={params.search}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
          />
          <PriceFilter
            currentMinPrice={params.minPrice}
            currentMaxPrice={params.maxPrice}
            category={params.category}
            search={params.search}
          />
          <BrandFilter
            category={params.category}
            search={params.search}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
          />
          <ColorFilter
            category={params.category}
            search={params.search}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
          />
          <SizeFilter
            category={params.category}
            search={params.search}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
          />
          <ShopAttributeFacetsFilter />
        </div>
      </aside>

      <MobileFiltersDrawer openEventName={MOBILE_FILTERS_EVENT}>
        <div className="space-y-0 rounded-[20px] bg-white px-4 pb-4 pt-3 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
          <CategoryFilter
            category={params.category}
            search={params.search}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
          />
          <div className="h-6 shrink-0" aria-hidden />
          <PriceFilter
            currentMinPrice={params.minPrice}
            currentMaxPrice={params.maxPrice}
            category={params.category}
            search={params.search}
          />
          <div className="h-6 shrink-0" aria-hidden />
          <BrandFilter
            category={params.category}
            search={params.search}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
          />
          <div className="h-6 shrink-0" aria-hidden />
          <ColorFilter
            category={params.category}
            search={params.search}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
          />
          <div className="h-6 shrink-0" aria-hidden />
          <SizeFilter
            category={params.category}
            search={params.search}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
          />
          <div className="h-6 shrink-0" aria-hidden />
          <ShopAttributeFacetsFilter />
        </div>
      </MobileFiltersDrawer>
    </ProductsFiltersProvider>
  );
}

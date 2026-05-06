import { Suspense } from 'react';
import { PriceFilter } from '@/components/PriceFilter';
import { BrandFilter } from '@/components/BrandFilter';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ColorFilter } from '@/components/ColorFilter';
import { SizeFilter } from '@/components/SizeFilter';
import { ShopAttributeFacetsFilter } from '@/components/ShopAttributeFacetsFilter';
import { ProductsFiltersProvider } from '@/components/ProductsFiltersProvider';
import { MobileFiltersDrawer } from '@/components/MobileFiltersDrawer';
import { productsFiltersSectionFont } from '@/lib/products-filters-typography';
import { t } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';
import { MOBILE_FILTERS_EVENT } from '@/lib/events';
import {
  getProductsFiltersCached,
  searchParamsRecordToUrlSearchParams,
} from '@/lib/cache/products-filters-redis';
import { buildTechnicalFilterQuerySignature } from '@/lib/services/products-technical-filters';
import type { ProductsPageSearchParams } from './products-page-search-params';

export type ProductsShopFiltersColumnProps = {
  readonly raw: ProductsPageSearchParams;
  readonly language: LanguageCode;
  readonly params: {
    category?: string;
    search?: string;
    filter?: string;
    minPrice?: string;
    maxPrice?: string;
    limit?: string;
  };
  readonly filtersMinPrice: number | undefined;
  readonly filtersMaxPrice: number | undefined;
};

/**
 * Sidebar + mobile filter drawer: streams after the PLP grid so listing data is not blocked on facet queries.
 */
export async function ProductsShopFiltersColumn({
  raw,
  language,
  params,
  filtersMinPrice,
  filtersMaxPrice,
}: ProductsShopFiltersColumnProps) {
  const filtersPayload = await getProductsFiltersCached({
    category: params.category?.trim() || undefined,
    search: params.search?.trim() || undefined,
    filter: params.filter?.trim() || undefined,
    minPrice: filtersMinPrice,
    maxPrice: filtersMaxPrice,
    lang: language,
    rawSearchParams: raw,
  });

  const technicalFilterSignature = buildTechnicalFilterQuerySignature(
    searchParamsRecordToUrlSearchParams(raw),
  );
  const initialFiltersKey = `${params.category ?? ''}|${params.search ?? ''}|${params.minPrice ?? ''}|${params.maxPrice ?? ''}|${language}|${technicalFilterSignature}|${params.filter ?? ''}`;

  return (
    <Suspense fallback={productsShopFiltersColumnSkeletonAria()}>
    <ProductsFiltersProvider
      category={params.category}
      search={params.search}
      filter={params.filter}
      minPrice={params.minPrice}
      maxPrice={params.maxPrice}
      initialFiltersData={filtersPayload}
      initialFiltersKey={initialFiltersKey}
    >
      <aside className="hidden w-[16rem] shrink-0 bg-white dark:bg-[var(--app-bg)] min-[744px]:sticky min-[744px]:top-4 min-[744px]:z-10 min-[744px]:self-start min-[744px]:block xl:w-[20rem]">
        <div className="border-r border-solid border-[#e2e8f0] dark:border-white/20 pb-4 pt-4 min-[744px]:pl-0 min-[744px]:pr-3 xl:pb-6 xl:pt-6 xl:pr-6">
          <div className="mb-4 flex flex-col gap-1 lg:mb-5 xl:mb-6">
            <h2
              className={`${productsFiltersSectionFont.className} text-sm font-semibold leading-5 tracking-[-0.31px] text-[#0f172b] dark:text-white lg:text-base lg:leading-6`}
            >
              {t(language, 'products.filters.panelTitle')}
            </h2>
            <p className="text-xs font-normal leading-snug tracking-[-0.15px] text-[#62748e] dark:text-white/72 lg:text-sm lg:leading-5">
              {t(language, 'products.filters.panelSubtitle')}
            </p>
          </div>
          <PriceFilter
            currentMinPrice={params.minPrice}
            currentMaxPrice={params.maxPrice}
            category={params.category}
            search={params.search}
          />
          <CategoryFilter
            category={params.category}
            search={params.search}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
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
          <div className="mb-4">
            <p className="text-sm font-normal leading-5 tracking-[-0.15px] text-[#62748e] dark:text-white/72">
              {t(language, 'products.filters.panelSubtitle')}
            </p>
          </div>
          <PriceFilter
            currentMinPrice={params.minPrice}
            currentMaxPrice={params.maxPrice}
            category={params.category}
            search={params.search}
          />
          <div className="h-6 shrink-0" aria-hidden />
          <CategoryFilter
            category={params.category}
            search={params.search}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
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
    </Suspense>
  );
}

export function productsShopFiltersColumnSkeletonAria() {
  return (
    <aside
      className="hidden w-[16rem] shrink-0 min-[744px]:block xl:w-[20rem]"
      aria-busy="true"
      aria-label="Loading filters"
    >
      <div className="space-y-3 border-r border-slate-200/90 pb-4 pt-4 dark:border-white/15 min-[744px]:pr-3 xl:space-y-4 xl:pb-6 xl:pt-6 xl:pr-6">
        <div className="h-5 w-28 animate-pulse rounded-md bg-slate-200 dark:bg-slate-600" />
        <div className="h-4 w-40 animate-pulse rounded-md bg-slate-200 dark:bg-slate-600" />
        <div className="h-32 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-600" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-600" />
        <div className="h-20 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-600" />
      </div>
    </aside>
  );
}

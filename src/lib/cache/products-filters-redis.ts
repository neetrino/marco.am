import { createHash } from 'node:crypto';
import type { TechnicalSpecFilters } from '@/lib/services/products-find-query/types';
import { productsService } from '@/lib/services/products.service';
import { parseTechnicalSpecFiltersFromSearchParams } from '@/lib/services/products-technical-filters';
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { stableStringifyForCacheKey } from '@/lib/cache/stable-stringify';
import type {
  ProductsFiltersCoreData,
  ProductsFiltersExtendedData,
} from '@/lib/shop-products-filters-types';
import {
  PRODUCTS_FILTERS_BASE_CACHE_TTL_SEC,
  buildProductsFiltersBaseCacheKey,
  isUnscopedShopFiltersScope,
} from '@/lib/cache/products-filters-scope';

export const PRODUCTS_FILTERS_CACHE_TTL_SEC = 120;

export type ProductsFiltersCachedPayload = Awaited<
  ReturnType<typeof productsService.getFilters>
>;

type FiltersKeyPayload = {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  lang: string;
  technicalSpecs: TechnicalSpecFilters;
  includeCategories?: boolean;
  categoriesOnly?: boolean;
};

export function searchParamsRecordToUrlSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) {
      continue;
    }
    const s = Array.isArray(value) ? value[0] : value;
    if (s !== undefined && s !== '') {
      q.set(key, s);
    }
  }
  return q;
}

export function buildProductsFiltersCacheKey(filters: FiltersKeyPayload): string {
  const hash = createHash('sha256')
    .update(stableStringifyForCacheKey(filters))
    .digest('hex');
  return `cache:products:filters:v4:${hash}`;
}

function buildProductsFiltersCoreCacheKey(filters: FiltersKeyPayload): string {
  return `${buildProductsFiltersCacheKey(filters)}:core`;
}

function buildProductsFiltersExtendedCacheKey(filters: FiltersKeyPayload): string {
  return `${buildProductsFiltersCacheKey(filters)}:extended`;
}

function buildKeyPayload(args: {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  lang: string;
  technicalSpecs: TechnicalSpecFilters;
  includeCategories?: boolean;
  categoriesOnly?: boolean;
}): FiltersKeyPayload {
  return {
    category: args.category?.trim() || undefined,
    search: args.search?.trim() || undefined,
    filter: args.filter?.trim() || undefined,
    minPrice: args.minPrice,
    maxPrice: args.maxPrice,
    lang: args.lang,
    technicalSpecs: args.technicalSpecs,
    includeCategories: args.includeCategories !== false,
    categoriesOnly: args.categoriesOnly === true,
  };
}

export async function getProductsFiltersBaseCached(
  lang: string,
): Promise<ProductsFiltersCachedPayload> {
  const cacheKey = buildProductsFiltersBaseCacheKey(lang);
  return getCachedJson<ProductsFiltersCachedPayload>(
    cacheKey,
    PRODUCTS_FILTERS_BASE_CACHE_TTL_SEC,
    () =>
      productsService.getFilters({
        lang,
        includeCategories: true,
      }),
  );
}

export async function getProductsFiltersCached(args: {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  lang: string;
  includeCategories?: boolean;
  categoriesOnly?: boolean;
  technicalSpecs?: TechnicalSpecFilters;
  rawSearchParams?: Record<string, string | string[] | undefined>;
}): Promise<ProductsFiltersCachedPayload> {
  const technicalSpecs =
    args.technicalSpecs ??
    parseTechnicalSpecFiltersFromSearchParams(
      args.rawSearchParams
        ? searchParamsRecordToUrlSearchParams(args.rawSearchParams)
        : new URLSearchParams(),
    );
  const keyPayload = buildKeyPayload({
    category: args.category,
    search: args.search,
    filter: args.filter,
    minPrice: args.minPrice,
    maxPrice: args.maxPrice,
    lang: args.lang,
    technicalSpecs,
    includeCategories: args.includeCategories,
    categoriesOnly: args.categoriesOnly,
  });

  if (isUnscopedShopFiltersScope(keyPayload)) {
    return getProductsFiltersBaseCached(args.lang);
  }

  const cacheKey = buildProductsFiltersCacheKey(keyPayload);
  return getCachedJson<ProductsFiltersCachedPayload>(
    cacheKey,
    PRODUCTS_FILTERS_CACHE_TTL_SEC,
    () =>
      productsService.getFilters({
        category: keyPayload.category,
        search: keyPayload.search,
        filter: keyPayload.filter,
        minPrice: keyPayload.minPrice,
        maxPrice: keyPayload.maxPrice,
        lang: keyPayload.lang,
        technicalSpecs: keyPayload.technicalSpecs,
        includeCategories: keyPayload.includeCategories,
        categoriesOnly: keyPayload.categoriesOnly,
      }),
  );
}

export async function getProductsFiltersCoreCached(args: {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  lang: string;
  technicalSpecs?: TechnicalSpecFilters;
  rawSearchParams?: Record<string, string | string[] | undefined>;
}): Promise<ProductsFiltersCoreData> {
  const technicalSpecs =
    args.technicalSpecs ??
    parseTechnicalSpecFiltersFromSearchParams(
      args.rawSearchParams
        ? searchParamsRecordToUrlSearchParams(args.rawSearchParams)
        : new URLSearchParams(),
    );
  const keyPayload = buildKeyPayload({
    category: args.category,
    search: args.search,
    filter: args.filter,
    minPrice: args.minPrice,
    maxPrice: args.maxPrice,
    lang: args.lang,
    technicalSpecs,
    includeCategories: true,
    categoriesOnly: false,
  });

  if (isUnscopedShopFiltersScope(keyPayload)) {
    const base = await getProductsFiltersBaseCached(args.lang);
    return {
      categories: base.categories,
      brands: base.brands,
      priceRange: base.priceRange,
    };
  }

  const cacheKey = buildProductsFiltersCoreCacheKey(keyPayload);
  return getCachedJson<ProductsFiltersCoreData>(cacheKey, PRODUCTS_FILTERS_CACHE_TTL_SEC, () =>
    productsService.getFiltersCoreFast({
      category: keyPayload.category,
      search: keyPayload.search,
      filter: keyPayload.filter,
      minPrice: keyPayload.minPrice,
      maxPrice: keyPayload.maxPrice,
      lang: keyPayload.lang,
      technicalSpecs: keyPayload.technicalSpecs,
      includeCategories: true,
    }),
  );
}

export async function getProductsFiltersExtendedCached(args: {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  lang: string;
  technicalSpecs?: TechnicalSpecFilters;
  rawSearchParams?: Record<string, string | string[] | undefined>;
}): Promise<ProductsFiltersExtendedData> {
  const technicalSpecs =
    args.technicalSpecs ??
    parseTechnicalSpecFiltersFromSearchParams(
      args.rawSearchParams
        ? searchParamsRecordToUrlSearchParams(args.rawSearchParams)
        : new URLSearchParams(),
    );
  const keyPayload = buildKeyPayload({
    category: args.category,
    search: args.search,
    filter: args.filter,
    minPrice: args.minPrice,
    maxPrice: args.maxPrice,
    lang: args.lang,
    technicalSpecs,
    includeCategories: true,
    categoriesOnly: false,
  });

  if (isUnscopedShopFiltersScope(keyPayload)) {
    const base = await getProductsFiltersBaseCached(args.lang);
    return {
      colors: base.colors,
      sizes: base.sizes,
      attributeFacets: base.attributeFacets,
    };
  }

  const cacheKey = buildProductsFiltersExtendedCacheKey(keyPayload);
  return getCachedJson<ProductsFiltersExtendedData>(
    cacheKey,
    PRODUCTS_FILTERS_CACHE_TTL_SEC,
    () =>
      productsService.getFiltersExtended({
        category: keyPayload.category,
        search: keyPayload.search,
        filter: keyPayload.filter,
        minPrice: keyPayload.minPrice,
        maxPrice: keyPayload.maxPrice,
        lang: keyPayload.lang,
        technicalSpecs: keyPayload.technicalSpecs,
      }),
  );
}

export async function warmProductsFiltersBaseCaches(
  locales: readonly string[] = ['en', 'hy', 'ru'],
): Promise<void> {
  await Promise.all(locales.map((lang) => getProductsFiltersBaseCached(lang)));
}

export async function invalidateProductsFiltersPublicCaches(): Promise<void> {
  const { cacheService } = await import('@/lib/services/cache.service');
  const { invalidateShopFilterBrandLabelsCache } = await import(
    '@/lib/cache/shop-filter-brand-labels-cache'
  );
  await Promise.all([
    cacheService.deletePattern('cache:products:filters:*'),
    invalidateShopFilterBrandLabelsCache(),
  ]);
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useShopProductsListingSearchParams } from '@/lib/use-shop-products-listing-search-params';
import { SHOP_PRODUCTS_LISTING_PARAMS_EVENT } from '@/lib/shop-products-listing-params-event';
import { apiClient } from '../lib/api-client';
import { t as translate } from '../lib/i18n';
import type { LanguageCode } from '../lib/language';
import { LanguagePreferenceContext } from '../lib/language-context';
import { buildProductsFiltersScopeKeyFromSearchParams } from '@/lib/products-filters-client-key';
import {
  readShopFiltersCache,
  writeShopFiltersCache,
} from '@/lib/shop-products-filters-client-cache';
import { setShopCategoryFilterTree } from '@/lib/shop-category-filter-tree-store';
import {
  EMPTY_PRODUCTS_FILTERS,
  type BrandOption,
  type CategoryFilterOption,
  type ColorOption,
  type PriceRangeOption,
  type ProductsFiltersCoreData,
  type ProductsFiltersData,
  type ProductsFiltersExtendedData,
  type SizeOption,
} from '@/lib/shop-products-filters-types';

export type {
  BrandOption,
  CategoryFilterOption,
  ColorOption,
  PriceRangeOption,
  ProductsFiltersCoreData,
  ProductsFiltersData,
  ProductsFiltersExtendedData,
  SizeOption,
};

interface ProductsFiltersContextValue {
  data: ProductsFiltersData | null;
  loading: boolean;
  categoriesLoading: boolean;
  extendedLoading: boolean;
  error: boolean;
  refetch: () => void;
  language: LanguageCode;
}

const ProductsFiltersContext = createContext<ProductsFiltersContextValue | null>(null);

type HydrationContextValue = {
  applyCategories: (categories: CategoryFilterOption[]) => void;
  applyCore: (core: ProductsFiltersCoreData, key: string, includeScopedCategories: boolean) => void;
};

const ProductsFiltersHydrationContext = createContext<HydrationContextValue | null>(null);

const FACET_REFETCH_DELAY_MS = 280;

function mergeFilterPayload(payload: ProductsFiltersData): ProductsFiltersData {
  return {
    colors: payload.colors ?? [],
    sizes: payload.sizes ?? [],
    brands: payload.brands ?? [],
    categories: payload.categories ?? [],
    attributeFacets: payload.attributeFacets ?? [],
    priceRange: payload.priceRange ?? EMPTY_PRODUCTS_FILTERS.priceRange,
  };
}

function readBrowserQueryString(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.search.startsWith('?')
    ? window.location.search.slice(1)
    : window.location.search;
}

function resolveInitialFiltersFromCache(language: LanguageCode): {
  data: ProductsFiltersData | null;
  loading: boolean;
  syncedKey: string | null;
  hasData: boolean;
  extendedLoading: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      data: null,
      loading: false,
      syncedKey: null,
      hasData: false,
      extendedLoading: true,
    };
  }

  const urlParams = new URLSearchParams(readBrowserQueryString());
  const key = buildProductsFiltersScopeKeyFromSearchParams(urlParams, language);
  const cached = readShopFiltersCache(key);
  if (!cached) {
    return {
      data: null,
      loading: false,
      syncedKey: null,
      hasData: false,
      extendedLoading: true,
    };
  }

  return {
    data: mergeFilterPayload(cached),
    loading: false,
    syncedKey: key,
    hasData: true,
    extendedLoading: false,
  };
}

function buildFacetRefetchScopeKey(searchParams: URLSearchParams, lang: string): string {
  return buildProductsFiltersScopeKeyFromSearchParams(searchParams, lang as LanguageCode);
}

interface ProductsFiltersProviderProps {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: string;
  maxPrice?: string;
  language?: LanguageCode;
  children: ReactNode;
}

export function ProductsFiltersProvider({
  category,
  search,
  filter,
  minPrice,
  maxPrice,
  language: languageProp,
  children,
}: ProductsFiltersProviderProps) {
  const preferenceLang = useContext(LanguagePreferenceContext);
  const resolvedLanguage = languageProp ?? preferenceLang;
  const searchParams = useShopProductsListingSearchParams();
  const mountFiltersStateRef = useRef<ReturnType<typeof resolveInitialFiltersFromCache> | null>(
    null,
  );
  if (mountFiltersStateRef.current === null) {
    mountFiltersStateRef.current = resolveInitialFiltersFromCache(resolvedLanguage);
  }
  const mountFiltersState = mountFiltersStateRef.current;
  const [data, setData] = useState<ProductsFiltersData | null>(mountFiltersState.data);
  const [loading, setLoading] = useState(mountFiltersState.loading);
  const [extendedLoading, setExtendedLoading] = useState(mountFiltersState.extendedLoading);
  const [error, setError] = useState(false);
  const syncedFiltersKeyRef = useRef<string | null>(mountFiltersState.syncedKey);
  const hasFiltersDataRef = useRef(mountFiltersState.hasData);
  const hasExtendedDataRef = useRef(
    Boolean(mountFiltersState.data?.colors?.length || mountFiltersState.data?.sizes?.length),
  );
  const lastFacetScopeRef = useRef<string | null>(null);
  const facetRefetchTimerRef = useRef<number | null>(null);

  const filtersClientKey = useMemo(
    () => buildProductsFiltersScopeKeyFromSearchParams(searchParams, resolvedLanguage),
    [searchParams, resolvedLanguage],
  );

  const buildFilterApiParams = useCallback((): Record<string, string> => {
    const lang = resolvedLanguage;
    const params: Record<string, string> = { lang, includeCategories: '1' };
    const categoryParam = searchParams.get('category') ?? category;
    const searchParam = searchParams.get('search') ?? search;
    const minPriceParam = searchParams.get('minPrice') ?? minPrice;
    const maxPriceParam = searchParams.get('maxPrice') ?? maxPrice;
    const filterParam = searchParams.get('filter') ?? filter;
    if (categoryParam) params.category = categoryParam;
    if (searchParam) params.search = searchParam;
    if (filterParam) params.filter = filterParam;
    if (minPriceParam) params.minPrice = minPriceParam;
    if (maxPriceParam) params.maxPrice = maxPriceParam;
    searchParams.forEach((v, k) => {
      if (k.startsWith('spec.') || k === 'specs') {
        params[k] = v;
      }
    });
    return params;
  }, [category, filter, maxPrice, minPrice, resolvedLanguage, search, searchParams]);

  const persistFilters = useCallback((merged: ProductsFiltersData, key: string) => {
    syncedFiltersKeyRef.current = key;
    hasFiltersDataRef.current = true;
    writeShopFiltersCache(key, merged);
    if (merged.categories.length > 0) {
      setShopCategoryFilterTree(merged.categories);
    }
  }, []);

  const applyCategories = useCallback(
    (categories: CategoryFilterOption[]) => {
      if (categories.length === 0) {
        return;
      }
      setData((prev) => {
        const merged = mergeFilterPayload({
          ...(prev ?? EMPTY_PRODUCTS_FILTERS),
          categories,
        });
        persistFilters(merged, filtersClientKey);
        return merged;
      });
      setLoading(false);
      setError(false);
    },
    [filtersClientKey, persistFilters],
  );

  const applyCore = useCallback(
    (core: ProductsFiltersCoreData, key: string, includeScopedCategories: boolean) => {
      setData((prev) => {
        const merged = mergeFilterPayload({
          ...(prev ?? EMPTY_PRODUCTS_FILTERS),
          brands: core.brands,
          priceRange: core.priceRange,
          ...(includeScopedCategories ? { categories: core.categories } : {}),
        });
        persistFilters(merged, key);
        return merged;
      });
      setLoading(false);
      setError(false);
    },
    [persistFilters],
  );

  const applyExtended = useCallback(
    (extended: ProductsFiltersExtendedData, key: string) => {
      setData((prev) => {
        const merged = mergeFilterPayload({
          ...(prev ?? EMPTY_PRODUCTS_FILTERS),
          ...extended,
        });
        persistFilters(merged, key);
        return merged;
      });
      hasExtendedDataRef.current = true;
      setExtendedLoading(false);
      setError(false);
    },
    [persistFilters],
  );

  const fetchExtended = useCallback(async () => {
    if (hasExtendedDataRef.current) {
      return;
    }
    setExtendedLoading(true);
    try {
      const extended = await apiClient.get<ProductsFiltersExtendedData>(
        '/api/v1/products/filters/extended',
        { params: buildFilterApiParams() },
      );
      applyExtended(extended, filtersClientKey);
    } catch {
      if (!hasFiltersDataRef.current) {
        setError(true);
      }
    } finally {
      setExtendedLoading(false);
    }
  }, [applyExtended, buildFilterApiParams, filtersClientKey]);

  const fetchCategoriesFallback = useCallback(async () => {
    if ((data?.categories?.length ?? 0) > 0) {
      return;
    }
    try {
      const response = await apiClient.get<{ categories: CategoryFilterOption[] }>(
        '/api/v1/products/filters/categories',
        { params: { lang: resolvedLanguage } },
      );
      applyCategories(response.categories ?? []);
    } catch {
      /* Streamed SSR hydration or core fetch will supply categories. */
    }
  }, [applyCategories, data?.categories?.length, resolvedLanguage]);

  const fetchFilters = useCallback(async () => {
    setError(false);
    if (!hasFiltersDataRef.current) {
      setLoading(true);
    }
    setExtendedLoading(true);
    try {
      const res = await apiClient.get<ProductsFiltersData>('/api/v1/products/filters', {
        params: buildFilterApiParams(),
      });
      const merged = mergeFilterPayload(res);
      setData(merged);
      persistFilters(merged, filtersClientKey);
      hasExtendedDataRef.current = true;
    } catch {
      if (!hasFiltersDataRef.current) {
        setError(true);
        setData(EMPTY_PRODUCTS_FILTERS);
      }
    } finally {
      setLoading(false);
      setExtendedLoading(false);
    }
  }, [buildFilterApiParams, filtersClientKey, persistFilters]);

  const fetchExtendedRef = useRef(fetchExtended);
  fetchExtendedRef.current = fetchExtended;
  const fetchCategoriesFallbackRef = useRef(fetchCategoriesFallback);
  fetchCategoriesFallbackRef.current = fetchCategoriesFallback;
  const fetchFiltersRef = useRef(fetchFilters);
  fetchFiltersRef.current = fetchFilters;

  useLayoutEffect(() => {
    if (syncedFiltersKeyRef.current === filtersClientKey && hasExtendedDataRef.current) {
      return;
    }

    const cached = readShopFiltersCache(filtersClientKey);
    if (cached) {
      setData(mergeFilterPayload(cached));
      syncedFiltersKeyRef.current = filtersClientKey;
      hasFiltersDataRef.current = true;
      hasExtendedDataRef.current = true;
      setExtendedLoading(false);
      setLoading(false);
      setShopCategoryFilterTree(cached.categories);
      return;
    }

    syncedFiltersKeyRef.current = filtersClientKey;
    hasExtendedDataRef.current = false;
    void fetchCategoriesFallbackRef.current();
    void fetchExtendedRef.current();
  }, [filtersClientKey]);

  useEffect(() => {
    const scheduleFacetRefetch = () => {
      const scopeKey = buildFacetRefetchScopeKey(searchParams, resolvedLanguage);
      if (scopeKey === syncedFiltersKeyRef.current && hasExtendedDataRef.current) {
        return;
      }
      if (scopeKey === lastFacetScopeRef.current) {
        return;
      }
      lastFacetScopeRef.current = scopeKey;
      if (facetRefetchTimerRef.current !== null) {
        window.clearTimeout(facetRefetchTimerRef.current);
      }
      facetRefetchTimerRef.current = window.setTimeout(() => {
        facetRefetchTimerRef.current = null;
        hasExtendedDataRef.current = false;
        void fetchFiltersRef.current();
      }, FACET_REFETCH_DELAY_MS);
    };

    window.addEventListener(SHOP_PRODUCTS_LISTING_PARAMS_EVENT, scheduleFacetRefetch);
    return () => {
      window.removeEventListener(SHOP_PRODUCTS_LISTING_PARAMS_EVENT, scheduleFacetRefetch);
      if (facetRefetchTimerRef.current !== null) {
        window.clearTimeout(facetRefetchTimerRef.current);
      }
    };
  }, [resolvedLanguage, searchParams]);

  const hydrationValue = useMemo<HydrationContextValue>(
    () => ({ applyCategories, applyCore }),
    [applyCategories, applyCore],
  );

  const categoriesLoading = !(data?.categories?.length ?? 0);

  const value = useMemo<ProductsFiltersContextValue>(
    () => ({
      data,
      loading,
      categoriesLoading,
      extendedLoading,
      error,
      refetch: fetchFilters,
      language: resolvedLanguage,
    }),
    [data, loading, categoriesLoading, extendedLoading, error, fetchFilters, resolvedLanguage],
  );

  return (
    <ProductsFiltersHydrationContext.Provider value={hydrationValue}>
      <ProductsFiltersContext.Provider value={value}>{children}</ProductsFiltersContext.Provider>
    </ProductsFiltersHydrationContext.Provider>
  );
}

export function useProductsFilters(): ProductsFiltersContextValue | null {
  return useContext(ProductsFiltersContext);
}

export function useShopFiltersTranslation() {
  const filtersCtx = useContext(ProductsFiltersContext);
  const preferenceLang = useContext(LanguagePreferenceContext);
  const lang = filtersCtx?.language ?? preferenceLang;

  const tFn = useCallback((path: string) => translate(lang, path), [lang]);

  return useMemo(() => ({ t: tFn, lang }), [tFn, lang]);
}

type ProductsFiltersCategoryHydrationProps = {
  readonly categories: CategoryFilterOption[];
};

export function ProductsFiltersCategoryHydration({
  categories,
}: ProductsFiltersCategoryHydrationProps) {
  const hydrate = useContext(ProductsFiltersHydrationContext);

  useLayoutEffect(() => {
    hydrate?.applyCategories(categories);
  }, [categories, hydrate]);

  return null;
}

type ProductsFiltersCoreHydrationProps = {
  readonly core: ProductsFiltersCoreData;
  readonly filtersKey: string;
  readonly includeScopedCategories: boolean;
};

export function ProductsFiltersCoreHydration({
  core,
  filtersKey,
  includeScopedCategories,
}: ProductsFiltersCoreHydrationProps) {
  const hydrate = useContext(ProductsFiltersHydrationContext);

  useLayoutEffect(() => {
    hydrate?.applyCore(core, filtersKey, includeScopedCategories);
  }, [core, filtersKey, includeScopedCategories, hydrate]);

  return null;
}

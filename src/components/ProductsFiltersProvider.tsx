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
import type { ShopProductsListingParamsDetail } from '@/lib/shop-products-listing-params-event';
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
  type ProductsFiltersData,
  type SizeOption,
} from '@/lib/shop-products-filters-types';

export type {
  BrandOption,
  CategoryFilterOption,
  ColorOption,
  PriceRangeOption,
  ProductsFiltersData,
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
  applyFilters: (filters: ProductsFiltersData, key: string) => void;
};

const ProductsFiltersHydrationContext = createContext<HydrationContextValue | null>(null);

const FACET_REFETCH_DELAY_MS = 0;

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

function extractFiltersPayload(payload: ProductsFiltersData | { filters?: ProductsFiltersData }): ProductsFiltersData {
  return mergeFilterPayload('filters' in payload && payload.filters ? payload.filters : payload as ProductsFiltersData);
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
    Boolean(
      mountFiltersState.data?.colors?.length ||
        mountFiltersState.data?.sizes?.length ||
        mountFiltersState.data?.attributeFacets?.length,
    ),
  );
  const lastFacetScopeRef = useRef<string | null>(null);
  const facetRefetchTimerRef = useRef<number | null>(null);
  const filtersFetchGenerationRef = useRef(0);

  const filtersClientKey = useMemo(
    () => buildProductsFiltersScopeKeyFromSearchParams(searchParams, resolvedLanguage),
    [searchParams, resolvedLanguage],
  );

  const buildFilterApiParams = useCallback((sourceParams = searchParams): Record<string, string> => {
    const lang = resolvedLanguage;
    const params: Record<string, string> = {
      lang,
      includeFilters: '1',
      includeItems: '0',
    };
    const categoryParam = sourceParams.get('category') ?? category;
    const searchParam = sourceParams.get('search') ?? search;
    const minPriceParam = sourceParams.get('minPrice') ?? minPrice;
    const maxPriceParam = sourceParams.get('maxPrice') ?? maxPrice;
    const filterParam = sourceParams.get('filter') ?? filter;
    const brandParam = sourceParams.get('brand');
    const colorsParam = sourceParams.get('colors');
    const sizesParam = sourceParams.get('sizes');
    const pricePresenceParam = sourceParams.get('pricePresence');
    if (categoryParam) params.category = categoryParam;
    if (searchParam) params.search = searchParam;
    if (filterParam) params.filter = filterParam;
    if (minPriceParam) params.minPrice = minPriceParam;
    if (maxPriceParam) params.maxPrice = maxPriceParam;
    if (brandParam) params.brand = brandParam;
    if (colorsParam) params.colors = colorsParam;
    if (sizesParam) params.sizes = sizesParam;
    if (pricePresenceParam) params.pricePresence = pricePresenceParam;
    sourceParams.forEach((v, k) => {
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

  const applyFilters = useCallback(
    (filters: ProductsFiltersData, key: string) => {
      const merged = mergeFilterPayload(filters);
      setData(merged);
      persistFilters(merged, key);
      hasExtendedDataRef.current = true;
      setLoading(false);
      setExtendedLoading(false);
      setError(false);
    },
    [persistFilters],
  );

  const fetchFilters = useCallback(async (sourceParams = searchParams, key = filtersClientKey) => {
    const generation = filtersFetchGenerationRef.current + 1;
    filtersFetchGenerationRef.current = generation;
    setError(false);
    if (!hasFiltersDataRef.current) {
      setLoading(true);
    }
    setExtendedLoading(true);
    try {
      const res = await apiClient.get<ProductsFiltersData | { filters?: ProductsFiltersData }>('/api/v1/products/plp', {
        params: buildFilterApiParams(sourceParams),
      });
      if (generation !== filtersFetchGenerationRef.current) {
        return;
      }
      applyFilters(extractFiltersPayload(res), key);
    } catch {
      if (generation !== filtersFetchGenerationRef.current) {
        return;
      }
      if (!hasFiltersDataRef.current) {
        setError(true);
        setData(EMPTY_PRODUCTS_FILTERS);
      }
    } finally {
      if (generation === filtersFetchGenerationRef.current) {
        setLoading(false);
        setExtendedLoading(false);
      }
    }
  }, [applyFilters, buildFilterApiParams, filtersClientKey, searchParams]);

  const fetchFiltersRef = useRef(fetchFilters);
  fetchFiltersRef.current = fetchFilters;

  useLayoutEffect(() => {
    if (syncedFiltersKeyRef.current === filtersClientKey && hasExtendedDataRef.current) {
      return;
    }
    if (
      syncedFiltersKeyRef.current === filtersClientKey &&
      lastFacetScopeRef.current === filtersClientKey
    ) {
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
    void fetchFiltersRef.current(searchParams, filtersClientKey);
  }, [filtersClientKey, searchParams]);

  useEffect(() => {
    const scheduleFacetRefetch = (event: Event) => {
      const detail = (event as CustomEvent<ShopProductsListingParamsDetail>).detail;
      const nextSearchParams = new URLSearchParams(detail?.queryString ?? readBrowserQueryString());
      const scopeKey = buildFacetRefetchScopeKey(nextSearchParams, resolvedLanguage);
      if (scopeKey === syncedFiltersKeyRef.current && hasExtendedDataRef.current) {
        return;
      }
      if (scopeKey === lastFacetScopeRef.current) {
        return;
      }
      lastFacetScopeRef.current = scopeKey;
      filtersFetchGenerationRef.current += 1;
      if (facetRefetchTimerRef.current !== null) {
        window.clearTimeout(facetRefetchTimerRef.current);
      }
      facetRefetchTimerRef.current = window.setTimeout(() => {
        facetRefetchTimerRef.current = null;
        const cached = readShopFiltersCache(scopeKey);
        if (cached) {
          setData(mergeFilterPayload(cached));
          syncedFiltersKeyRef.current = scopeKey;
          hasFiltersDataRef.current = true;
          hasExtendedDataRef.current = true;
          setExtendedLoading(false);
          setLoading(false);
          setShopCategoryFilterTree(cached.categories);
          return;
        }
        syncedFiltersKeyRef.current = scopeKey;
        hasExtendedDataRef.current = false;
        void fetchFiltersRef.current(nextSearchParams, scopeKey);
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
    () => ({ applyFilters }),
    [applyFilters],
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

type ProductsFiltersFullHydrationProps = {
  readonly filters: ProductsFiltersData;
  readonly filtersKey: string;
};

export function ProductsFiltersFullHydration({
  filters,
  filtersKey,
}: ProductsFiltersFullHydrationProps) {
  const hydrate = useContext(ProductsFiltersHydrationContext);

  useLayoutEffect(() => {
    hydrate?.applyFilters(filters, filtersKey);
  }, [filters, filtersKey, hydrate]);

  return null;
}

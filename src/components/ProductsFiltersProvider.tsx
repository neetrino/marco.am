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
  type ProductsFiltersShellData,
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
  ProductsFiltersShellData,
  SizeOption,
};

interface ProductsFiltersContextValue {
  data: ProductsFiltersData | null;
  loading: boolean;
  categoriesLoading: boolean;
  extendedLoading: boolean;
  countsPending: boolean;
  error: boolean;
  refetch: () => void;
  language: LanguageCode;
}

const ProductsFiltersContext = createContext<ProductsFiltersContextValue | null>(null);

type ApplyFiltersPayload = (payload: ProductsFiltersData, key: string) => void;

const ProductsFiltersHydrationContext = createContext<ApplyFiltersPayload | null>(null);

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

function mergeShellIntoData(
  current: ProductsFiltersData | null,
  shell: ProductsFiltersShellData,
): ProductsFiltersData {
  const base = current ?? EMPTY_PRODUCTS_FILTERS;
  return {
    ...base,
    categories: shell.categories.length > 0 ? shell.categories : base.categories,
    brands: shell.brands.length > 0 ? shell.brands : base.brands,
    priceRange:
      shell.priceRange.max > 0 ? shell.priceRange : base.priceRange,
  };
}

function hasPendingBrandCounts(brands: BrandOption[]): boolean {
  return brands.length > 0 && brands.every((brand) => brand.count === 0);
}

function readBrowserQueryString(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.search.startsWith('?')
    ? window.location.search.slice(1)
    : window.location.search;
}

function resolveInitialFiltersFromCache(args: {
  language: LanguageCode;
  initialShellData: ProductsFiltersShellData | null;
  initialFiltersData: ProductsFiltersData | null;
  initialFiltersKey: string | null;
}): {
  data: ProductsFiltersData | null;
  loading: boolean;
  syncedKey: string | null;
  hasData: boolean;
  extendedLoading: boolean;
  countsPending: boolean;
} {
  const { language, initialShellData, initialFiltersData, initialFiltersKey } = args;

  if (initialFiltersData && initialFiltersKey) {
    return {
      data: mergeFilterPayload(initialFiltersData),
      loading: false,
      syncedKey: initialFiltersKey,
      hasData: true,
      extendedLoading: false,
      countsPending: false,
    };
  }

  if (initialShellData) {
    const shellData = mergeShellIntoData(null, initialShellData);
    return {
      data: shellData,
      loading: false,
      syncedKey: null,
      hasData: true,
      extendedLoading: true,
      countsPending: hasPendingBrandCounts(shellData.brands),
    };
  }

  if (typeof window === 'undefined') {
    return {
      data: null,
      loading: true,
      syncedKey: null,
      hasData: false,
      extendedLoading: true,
      countsPending: false,
    };
  }

  const urlParams = new URLSearchParams(readBrowserQueryString());
  const key = buildProductsFiltersScopeKeyFromSearchParams(urlParams, language);
  const cached = readShopFiltersCache(key);
  if (!cached) {
    return {
      data: null,
      loading: true,
      syncedKey: null,
      hasData: false,
      extendedLoading: true,
      countsPending: false,
    };
  }

  return {
    data: mergeFilterPayload(cached),
    loading: false,
    syncedKey: key,
    hasData: true,
    extendedLoading: false,
    countsPending: false,
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
  initialShellData?: ProductsFiltersShellData | null;
  initialFiltersData?: ProductsFiltersData | null;
  initialFiltersKey?: string | null;
  children: ReactNode;
}

export function ProductsFiltersProvider({
  category,
  search,
  filter,
  minPrice,
  maxPrice,
  language: languageProp,
  initialShellData = null,
  initialFiltersData = null,
  initialFiltersKey = null,
  children,
}: ProductsFiltersProviderProps) {
  const preferenceLang = useContext(LanguagePreferenceContext);
  const resolvedLanguage = languageProp ?? preferenceLang;
  const searchParams = useShopProductsListingSearchParams();
  const mountFiltersStateRef = useRef<ReturnType<typeof resolveInitialFiltersFromCache> | null>(
    null,
  );
  if (mountFiltersStateRef.current === null) {
    mountFiltersStateRef.current = resolveInitialFiltersFromCache({
      language: resolvedLanguage,
      initialShellData,
      initialFiltersData,
      initialFiltersKey,
    });
  }
  const mountFiltersState = mountFiltersStateRef.current;
  const [data, setData] = useState<ProductsFiltersData | null>(mountFiltersState.data);
  const [loading, setLoading] = useState(mountFiltersState.loading);
  const [extendedLoading, setExtendedLoading] = useState(mountFiltersState.extendedLoading);
  const [countsPending, setCountsPending] = useState(mountFiltersState.countsPending);
  const [error, setError] = useState(false);
  const syncedFiltersKeyRef = useRef<string | null>(mountFiltersState.syncedKey);
  const hasFiltersDataRef = useRef(mountFiltersState.hasData);
  const hasFullFiltersRef = useRef(Boolean(initialFiltersData && initialFiltersKey));
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

  const applyFiltersPayload = useCallback(
    (payload: ProductsFiltersData, key: string) => {
      const merged = mergeFilterPayload(payload);
      setData(merged);
      setLoading(false);
      setExtendedLoading(false);
      setCountsPending(false);
      setError(false);
      syncedFiltersKeyRef.current = key;
      hasFiltersDataRef.current = true;
      hasFullFiltersRef.current = true;
      writeShopFiltersCache(key, merged);
      setShopCategoryFilterTree(merged.categories);
    },
    [],
  );

  const applyPartialPayload = useCallback(
    (partial: Partial<ProductsFiltersData>, key: string) => {
      setData((prev) => {
        const merged = mergeFilterPayload({
          ...(prev ?? EMPTY_PRODUCTS_FILTERS),
          ...partial,
        });
        writeShopFiltersCache(key, merged);
        setShopCategoryFilterTree(merged.categories);
        return merged;
      });
      hasFiltersDataRef.current = true;
      syncedFiltersKeyRef.current = key;
      setLoading(false);
      setCountsPending(false);
      setError(false);
    },
    [],
  );

  const fetchCoreAndExtended = useCallback(async () => {
    setError(false);
    if (!hasFiltersDataRef.current) {
      setLoading(true);
    }
    setExtendedLoading(true);
    const params = buildFilterApiParams();
    try {
      const [core, extended] = await Promise.all([
        apiClient.get<ProductsFiltersCoreData>('/api/v1/products/filters/core', { params }),
        apiClient.get<ProductsFiltersExtendedData>('/api/v1/products/filters/extended', { params }),
      ]);
      applyPartialPayload({ ...core, ...extended }, filtersClientKey);
      hasFullFiltersRef.current = true;
    } catch {
      if (!hasFiltersDataRef.current) {
        setError(true);
        setData(EMPTY_PRODUCTS_FILTERS);
      }
    } finally {
      setLoading(false);
      setExtendedLoading(false);
      setCountsPending(false);
    }
  }, [applyPartialPayload, buildFilterApiParams, filtersClientKey]);

  const fetchFilters = useCallback(async () => {
    setError(false);
    if (!hasFiltersDataRef.current) {
      setLoading(true);
    }
    try {
      const res = await apiClient.get<ProductsFiltersData>('/api/v1/products/filters', {
        params: buildFilterApiParams(),
      });
      applyFiltersPayload(
        {
          colors: res.colors ?? [],
          sizes: res.sizes ?? [],
          brands: res.brands ?? [],
          categories: res.categories ?? [],
          attributeFacets: res.attributeFacets ?? [],
          priceRange: res.priceRange ?? EMPTY_PRODUCTS_FILTERS.priceRange,
        },
        filtersClientKey,
      );
    } catch {
      if (!hasFiltersDataRef.current) {
        setError(true);
        setData(EMPTY_PRODUCTS_FILTERS);
        hasFiltersDataRef.current = true;
        syncedFiltersKeyRef.current = filtersClientKey;
      }
    } finally {
      setLoading(false);
      setExtendedLoading(false);
      setCountsPending(false);
    }
  }, [applyFiltersPayload, buildFilterApiParams, filtersClientKey]);

  const fetchCoreAndExtendedRef = useRef(fetchCoreAndExtended);
  fetchCoreAndExtendedRef.current = fetchCoreAndExtended;
  const fetchFiltersRef = useRef(fetchFilters);
  fetchFiltersRef.current = fetchFilters;

  useLayoutEffect(() => {
    if (
      initialFiltersData &&
      initialFiltersKey &&
      initialFiltersKey === filtersClientKey
    ) {
      if (syncedFiltersKeyRef.current !== filtersClientKey) {
        applyFiltersPayload(initialFiltersData, filtersClientKey);
      }
      return;
    }

    if (syncedFiltersKeyRef.current === filtersClientKey && hasFullFiltersRef.current) {
      return;
    }

    const cached = readShopFiltersCache(filtersClientKey);
    if (cached) {
      applyFiltersPayload(cached, filtersClientKey);
      return;
    }

    syncedFiltersKeyRef.current = filtersClientKey;

    if (initialShellData && !initialFiltersData) {
      return;
    }

    void fetchCoreAndExtendedRef.current();
  }, [
    filtersClientKey,
    initialFiltersData,
    initialFiltersKey,
    initialShellData,
    applyFiltersPayload,
  ]);

  useEffect(() => {
    if (!initialShellData || initialFiltersData) {
      return;
    }
    if (hasFullFiltersRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (hasFullFiltersRef.current) {
        return;
      }
      void fetchCoreAndExtendedRef.current();
    }, 2_500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filtersClientKey, initialFiltersData, initialShellData]);

  useEffect(() => {
    const scheduleFacetRefetch = () => {
      const lang = resolvedLanguage;
      const scopeKey = buildFacetRefetchScopeKey(searchParams, lang);
      if (scopeKey === syncedFiltersKeyRef.current && hasFullFiltersRef.current) {
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
        if (scopeKey === syncedFiltersKeyRef.current && hasFullFiltersRef.current) {
          return;
        }
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

  const applyServerHydration = useCallback(
    (payload: ProductsFiltersData, key: string) => {
      if (key !== filtersClientKey) {
        return;
      }
      if (syncedFiltersKeyRef.current === key && hasFullFiltersRef.current) {
        return;
      }
      applyFiltersPayload(payload, key);
    },
    [applyFiltersPayload, filtersClientKey],
  );

  const categoriesLoading = loading && !(data?.categories?.length ?? 0);

  const value = useMemo<ProductsFiltersContextValue>(
    () => ({
      data,
      loading,
      categoriesLoading,
      extendedLoading,
      countsPending,
      error,
      refetch: fetchFilters,
      language: resolvedLanguage,
    }),
    [
      data,
      loading,
      categoriesLoading,
      extendedLoading,
      countsPending,
      error,
      fetchFilters,
      resolvedLanguage,
    ],
  );

  return (
    <ProductsFiltersHydrationContext.Provider value={applyServerHydration}>
      <ProductsFiltersContext.Provider value={value}>
        {children}
      </ProductsFiltersContext.Provider>
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

type ProductsFiltersServerHydrationProps = {
  readonly initialFiltersData: ProductsFiltersData;
  readonly initialFiltersKey: string;
};

export function ProductsFiltersServerHydration({
  initialFiltersData,
  initialFiltersKey,
}: ProductsFiltersServerHydrationProps) {
  const hydrate = useContext(ProductsFiltersHydrationContext);

  useLayoutEffect(() => {
    hydrate?.(initialFiltersData, initialFiltersKey);
  }, [hydrate, initialFiltersData, initialFiltersKey]);

  return null;
}

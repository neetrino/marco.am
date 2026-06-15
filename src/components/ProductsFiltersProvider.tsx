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
import type { TechnicalSpecFacet } from '@/lib/services/products-technical-filters';
import {
  readShopFiltersCache,
  writeShopFiltersCache,
} from '@/lib/shop-products-filters-client-cache';
import { setShopCategoryFilterTree } from '@/lib/shop-category-filter-tree-store';

export interface ColorOption {
  value: string;
  label: string;
  count: number;
  imageUrl?: string | null;
  colors?: string[] | null;
}

export interface SizeOption {
  value: string;
  count: number;
}

export interface BrandOption {
  id: string;
  slug: string;
  name: string;
  count: number;
}

export interface CategoryFilterOption {
  slug: string;
  title: string;
  count: number;
  children: CategoryFilterOption[];
}

export interface PriceRangeOption {
  min: number;
  max: number;
  stepSize?: number | null;
  stepSizePerCurrency?: Record<string, number> | null;
}

export interface ProductsFiltersData {
  colors: ColorOption[];
  sizes: SizeOption[];
  brands: BrandOption[];
  categories: CategoryFilterOption[];
  attributeFacets: TechnicalSpecFacet[];
  priceRange: PriceRangeOption;
}

interface ProductsFiltersContextValue {
  data: ProductsFiltersData | null;
  loading: boolean;
  categoriesLoading: boolean;
  error: boolean;
  refetch: () => void;
  /** SSR / listing locale — aligned with facet API `lang` and filter copy. */
  language: LanguageCode;
}

const ProductsFiltersContext = createContext<ProductsFiltersContextValue | null>(null);

type ApplyFiltersPayload = (payload: ProductsFiltersData, key: string) => void;

const ProductsFiltersHydrationContext = createContext<ApplyFiltersPayload | null>(null);

const DEFAULT_FILTERS: ProductsFiltersData = {
  colors: [],
  sizes: [],
  brands: [],
  categories: [],
  attributeFacets: [],
  priceRange: { min: 0, max: 0, stepSize: null, stepSizePerCurrency: null },
};

/** Debounce facet count refresh while the user toggles several filters in a row. */
const FACET_REFETCH_DELAY_MS = 280;

function mergeFilterPayload(payload: ProductsFiltersData): ProductsFiltersData {
  return {
    colors: payload.colors ?? [],
    sizes: payload.sizes ?? [],
    brands: payload.brands ?? [],
    categories: payload.categories ?? [],
    attributeFacets: payload.attributeFacets ?? [],
    priceRange: payload.priceRange ?? DEFAULT_FILTERS.priceRange,
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

function resolveInitialFiltersFromCache(args: {
  language: LanguageCode;
  initialFiltersData: ProductsFiltersData | null;
  initialFiltersKey: string | null;
}): {
  data: ProductsFiltersData | null;
  loading: boolean;
  syncedKey: string | null;
  hasData: boolean;
} {
  const { language, initialFiltersData, initialFiltersKey } = args;

  if (initialFiltersData && initialFiltersKey) {
    return {
      data: mergeFilterPayload(initialFiltersData),
      loading: false,
      syncedKey: initialFiltersKey,
      hasData: true,
    };
  }

  if (typeof window === 'undefined') {
    return { data: null, loading: true, syncedKey: null, hasData: false };
  }

  const urlParams = new URLSearchParams(readBrowserQueryString());
  const key = buildProductsFiltersScopeKeyFromSearchParams(urlParams, language);
  const cached = readShopFiltersCache(key);
  if (!cached) {
    return { data: null, loading: true, syncedKey: null, hasData: false };
  }

  return {
    data: mergeFilterPayload(cached),
    loading: false,
    syncedKey: key,
    hasData: true,
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
  /** SSR locale — keeps `initialFiltersKey` aligned with the server prefetch key on hydration. */
  language?: LanguageCode;
  initialFiltersData?: ProductsFiltersData | null;
  initialFiltersKey?: string | null;
  /** PLP: skip client fetch until streamed RSC payload hydrates the provider. */
  awaitServerHydration?: boolean;
  children: ReactNode;
}

export function ProductsFiltersProvider({
  category,
  search,
  filter,
  minPrice,
  maxPrice,
  language: languageProp,
  initialFiltersData = null,
  initialFiltersKey = null,
  awaitServerHydration = false,
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
      initialFiltersData,
      initialFiltersKey,
    });
  }
  const mountFiltersState = mountFiltersStateRef.current;
  const [data, setData] = useState<ProductsFiltersData | null>(mountFiltersState.data);
  const [loading, setLoading] = useState(mountFiltersState.loading);
  const [error, setError] = useState(false);
  const syncedFiltersKeyRef = useRef<string | null>(mountFiltersState.syncedKey);
  const hasFiltersDataRef = useRef(mountFiltersState.hasData);
  const lastFacetScopeRef = useRef<string | null>(null);
  const facetRefetchTimerRef = useRef<number | null>(null);

  const filtersClientKey = useMemo(
    () => buildProductsFiltersScopeKeyFromSearchParams(searchParams, resolvedLanguage),
    [searchParams, resolvedLanguage],
  );

  const applyFiltersPayload = useCallback(
    (payload: ProductsFiltersData, key: string) => {
      const merged = mergeFilterPayload(payload);
      setData(merged);
      setLoading(false);
      setError(false);
      syncedFiltersKeyRef.current = key;
      hasFiltersDataRef.current = true;
      writeShopFiltersCache(key, merged);
      setShopCategoryFilterTree(merged.categories);
    },
    [],
  );

  const fetchFilters = useCallback(async () => {
    setError(false);
    if (!hasFiltersDataRef.current) {
      setLoading(true);
    }
    try {
      const lang = resolvedLanguage;
      const params: Record<string, string> = { lang };
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
      const res = await apiClient.get<ProductsFiltersData>('/api/v1/products/filters', {
        params: { ...params, includeCategories: '1' },
      });
      applyFiltersPayload(
        {
          colors: res.colors ?? [],
          sizes: res.sizes ?? [],
          brands: res.brands ?? [],
          categories: res.categories ?? [],
          attributeFacets: res.attributeFacets ?? [],
          priceRange: res.priceRange ?? DEFAULT_FILTERS.priceRange,
        },
        filtersClientKey,
      );
    } catch {
      setError(true);
      setData(DEFAULT_FILTERS);
      hasFiltersDataRef.current = true;
      syncedFiltersKeyRef.current = filtersClientKey;
    } finally {
      setLoading(false);
    }
  }, [applyFiltersPayload, category, search, filter, minPrice, maxPrice, resolvedLanguage, searchParams, filtersClientKey]);

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

    if (syncedFiltersKeyRef.current === filtersClientKey && hasFiltersDataRef.current) {
      return;
    }

    const cached = readShopFiltersCache(filtersClientKey);
    if (cached) {
      applyFiltersPayload(cached, filtersClientKey);
      return;
    }

    if (awaitServerHydration && !hasFiltersDataRef.current) {
      setLoading(true);
      syncedFiltersKeyRef.current = filtersClientKey;
      void fetchFiltersRef.current();
      return;
    }

    syncedFiltersKeyRef.current = filtersClientKey;
    void fetchFiltersRef.current();
  }, [
    awaitServerHydration,
    filtersClientKey,
    initialFiltersData,
    initialFiltersKey,
    applyFiltersPayload,
  ]);

  useEffect(() => {
    const scheduleFacetRefetch = () => {
      const lang = resolvedLanguage;
      const scopeKey = buildFacetRefetchScopeKey(searchParams, lang);
      if (scopeKey === syncedFiltersKeyRef.current) {
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
        if (scopeKey === syncedFiltersKeyRef.current) {
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
      if (syncedFiltersKeyRef.current === key && hasFiltersDataRef.current) {
        return;
      }
      applyFiltersPayload(payload, key);
    },
    [applyFiltersPayload, filtersClientKey],
  );

  const categoriesLoading = loading && !(data?.categories?.length ?? 0);

  const value = useMemo<ProductsFiltersContextValue>(
    () => ({ data, loading, categoriesLoading, error, refetch: fetchFilters, language: resolvedLanguage }),
    [data, loading, categoriesLoading, error, fetchFilters, resolvedLanguage],
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

/**
 * Translation hook for shop PLP filter UI — uses listing locale from {@link ProductsFiltersProvider}
 * so section titles match facet API language (Categories, Brands, Attributes, etc.).
 */
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

/** Applies streamed RSC facet payload into the mounted PLP filter provider. */
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

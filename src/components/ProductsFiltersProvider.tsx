'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useShopProductsListingSearchParams } from '@/lib/use-shop-products-listing-search-params';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';
import { buildTechnicalFilterQuerySignature } from '@/lib/services/products-technical-filters';
import type { TechnicalSpecFacet } from '@/lib/services/products-technical-filters';

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
}

const ProductsFiltersContext = createContext<ProductsFiltersContextValue | null>(null);

const DEFAULT_FILTERS: ProductsFiltersData = {
  colors: [],
  sizes: [],
  brands: [],
  categories: [],
  attributeFacets: [],
  priceRange: { min: 0, max: 0, stepSize: null, stepSizePerCurrency: null },
};

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

interface ProductsFiltersProviderProps {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: string;
  maxPrice?: string;
  /**
   * When the PLP prefetches filters on the server, pass the payload plus the same key
   * built from category/search/min/max + language + technical filter signature so the first client /filters round-trip is skipped.
   */
  initialFiltersData?: ProductsFiltersData | null;
  /** Must match client: category|search|minPrice|maxPrice|lang|technicalFilterSignature|filter */
  initialFiltersKey?: string | null;
  children: ReactNode;
}

export function ProductsFiltersProvider({
  category,
  search,
  filter,
  minPrice,
  maxPrice,
  initialFiltersData = null,
  initialFiltersKey = null,
  children,
}: ProductsFiltersProviderProps) {
  const searchParams = useShopProductsListingSearchParams();
  const [data, setData] = useState<ProductsFiltersData | null>(() =>
    initialFiltersData && initialFiltersKey
      ? mergeFilterPayload(initialFiltersData)
      : null,
  );
  const [loading, setLoading] = useState(
    () => !(initialFiltersData && initialFiltersKey),
  );
  const [error, setError] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const syncedFiltersKeyRef = useRef<string | null>(
    initialFiltersData && initialFiltersKey ? initialFiltersKey : null,
  );
  const hasFiltersDataRef = useRef(Boolean(initialFiltersData && initialFiltersKey));

  const technicalSignatureFromUrl = useMemo(
    () => buildTechnicalFilterQuerySignature(searchParams),
    [searchParams],
  );

  const filtersClientKey = useMemo(() => {
    const lang = getStoredLanguage();
    return `${category ?? ''}|${search ?? ''}|${minPrice ?? ''}|${maxPrice ?? ''}|${lang}|${technicalSignatureFromUrl}|${filter ?? ''}`;
  }, [category, search, minPrice, maxPrice, technicalSignatureFromUrl, filter]);

  const fetchFilters = useCallback(async () => {
    setError(false);
    if (!hasFiltersDataRef.current) {
      setLoading(true);
    }
    try {
      const lang = getStoredLanguage();
      const params: Record<string, string> = { lang };
      if (category) params.category = category;
      if (search) params.search = search;
      if (filter) params.filter = filter;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      searchParams.forEach((v, k) => {
        if (k.startsWith('spec.') || k === 'specs') {
          params[k] = v;
        }
      });
      const res = await apiClient.get<ProductsFiltersData>('/api/v1/products/filters', {
        params: { ...params, includeCategories: '0' },
      });
      setData((prev) => ({
        colors: res.colors ?? [],
        sizes: res.sizes ?? [],
        brands: res.brands ?? [],
        categories: prev?.categories ?? [],
        attributeFacets: res.attributeFacets ?? [],
        priceRange: res.priceRange ?? DEFAULT_FILTERS.priceRange,
      }));
      hasFiltersDataRef.current = true;
    } catch {
      setError(true);
      setData(DEFAULT_FILTERS);
      hasFiltersDataRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [category, search, filter, minPrice, maxPrice, searchParams]);

  useEffect(() => {
    if (
      initialFiltersData &&
      initialFiltersKey &&
      initialFiltersKey === filtersClientKey
    ) {
      if (syncedFiltersKeyRef.current !== filtersClientKey) {
        syncedFiltersKeyRef.current = filtersClientKey;
        setData(mergeFilterPayload(initialFiltersData));
        setLoading(false);
        setError(false);
        hasFiltersDataRef.current = true;
      }
      return;
    }

    syncedFiltersKeyRef.current = null;
    void fetchFilters();
  }, [filtersClientKey, initialFiltersData, initialFiltersKey, fetchFilters]);

  useEffect(() => {
    if (
      initialFiltersData?.categories?.length &&
      initialFiltersKey === filtersClientKey
    ) {
      setData((prev) => {
        const nextCategories = initialFiltersData.categories ?? [];
        if (prev?.categories === nextCategories) {
          return prev;
        }
        if (!prev) {
          return mergeFilterPayload({ ...initialFiltersData, categories: nextCategories });
        }
        return { ...prev, categories: nextCategories };
      });
      return;
    }

    let cancelled = false;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const lang = getStoredLanguage();
        const params: Record<string, string> = {
          lang,
          includeCategories: '1',
          categoriesOnly: '1',
        };
        if (category) params.category = category;
        if (search) params.search = search;
        if (filter) params.filter = filter;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        searchParams.forEach((v, k) => {
          if (k.startsWith('spec.') || k === 'specs') {
            params[k] = v;
          }
        });
        const res = await apiClient.get<ProductsFiltersData>('/api/v1/products/filters', { params });
        if (cancelled) {
          return;
        }
        setData((prev) => ({
          colors: prev?.colors ?? [],
          sizes: prev?.sizes ?? [],
          brands: prev?.brands ?? [],
          categories: res.categories ?? [],
          attributeFacets: prev?.attributeFacets ?? [],
          priceRange: prev?.priceRange ?? DEFAULT_FILTERS.priceRange,
        }));
      } catch {
        // Keep existing filters payload; categories can stay empty on failure.
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [
    filtersClientKey,
    initialFiltersData,
    initialFiltersKey,
    category,
    search,
    filter,
    minPrice,
    maxPrice,
    searchParams,
  ]);

  const value = useMemo<ProductsFiltersContextValue>(
    () => ({ data, loading, categoriesLoading, error, refetch: fetchFilters }),
    [data, loading, categoriesLoading, error, fetchFilters]
  );

  return (
    <ProductsFiltersContext.Provider value={value}>
      {children}
    </ProductsFiltersContext.Provider>
  );
}

export function useProductsFilters(): ProductsFiltersContextValue | null {
  return useContext(ProductsFiltersContext);
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProductsFiltersData | null>(() =>
    initialFiltersData && initialFiltersKey
      ? mergeFilterPayload(initialFiltersData)
      : null,
  );
  const [loading, setLoading] = useState(
    () => !(initialFiltersData && initialFiltersKey),
  );
  const [error, setError] = useState(false);

  const technicalSignatureFromUrl = useMemo(
    () => buildTechnicalFilterQuerySignature(searchParams),
    [searchParams],
  );

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    setError(false);
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
      const res = await apiClient.get<ProductsFiltersData>('/api/v1/products/filters', { params });
      setData({
        colors: res.colors ?? [],
        sizes: res.sizes ?? [],
        brands: res.brands ?? [],
        categories: res.categories ?? [],
        attributeFacets: res.attributeFacets ?? [],
        priceRange: res.priceRange ?? DEFAULT_FILTERS.priceRange,
      });
    } catch {
      setError(true);
      setData(DEFAULT_FILTERS);
    } finally {
      setLoading(false);
    }
  }, [category, search, filter, minPrice, maxPrice, searchParams]);

  useEffect(() => {
    const lang = getStoredLanguage();
    const clientKey = `${category ?? ''}|${search ?? ''}|${minPrice ?? ''}|${maxPrice ?? ''}|${lang}|${technicalSignatureFromUrl}|${filter ?? ''}`;
    if (
      initialFiltersData &&
      initialFiltersKey &&
      initialFiltersKey === clientKey
    ) {
      setData(mergeFilterPayload(initialFiltersData));
      setLoading(false);
      setError(false);
      return;
    }
    void fetchFilters();
  }, [
    category,
    search,
    filter,
    minPrice,
    maxPrice,
    initialFiltersData,
    initialFiltersKey,
    technicalSignatureFromUrl,
    fetchFilters,
  ]);

  const value = useMemo<ProductsFiltersContextValue>(
    () => ({ data, loading, error, refetch: fetchFilters }),
    [data, loading, error, fetchFilters]
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

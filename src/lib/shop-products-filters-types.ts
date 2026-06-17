import type { TechnicalSpecFacet } from '@/lib/services/products-technical-filters';

export type ColorOption = {
  value: string;
  label: string;
  count: number;
  imageUrl?: string | null;
  colors?: string[] | null;
};

export type SizeOption = {
  value: string;
  count: number;
};

export type BrandOption = {
  id: string;
  slug: string;
  name: string;
  count: number;
};

export type CategoryFilterOption = {
  slug: string;
  title: string;
  count: number;
  children: CategoryFilterOption[];
};

export type PriceRangeOption = {
  min: number;
  max: number;
  stepSize?: number | null;
  stepSizePerCurrency?: Record<string, number> | null;
};

/** Categories, brands, and price — loaded in the core facet phase. */
export type ProductsFiltersCoreData = {
  categories: CategoryFilterOption[];
  brands: BrandOption[];
  priceRange: PriceRangeOption;
};

/** Colors, sizes, and attribute facets — loaded after core. */
export type ProductsFiltersExtendedData = {
  colors: ColorOption[];
  sizes: SizeOption[];
  attributeFacets: TechnicalSpecFacet[];
};

export type ProductsFiltersData = ProductsFiltersCoreData & ProductsFiltersExtendedData;

export const EMPTY_PRICE_RANGE: PriceRangeOption = {
  min: 0,
  max: 0,
  stepSize: null,
  stepSizePerCurrency: null,
};

export const EMPTY_PRODUCTS_FILTERS: ProductsFiltersData = {
  colors: [],
  sizes: [],
  brands: [],
  categories: [],
  attributeFacets: [],
  priceRange: EMPTY_PRICE_RANGE,
};

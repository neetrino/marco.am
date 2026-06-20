import type { TechnicalSpecFilters } from '@/lib/services/products-find-query/types';

export type PlpReadModelSearchParams = {
  lang?: string;
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  ids?: string;
  brand?: string;
  filter?: string;
  minPrice?: string;
  maxPrice?: string;
  pricePresence?: string;
  colors?: string;
  sizes?: string;
  sort?: string;
  technicalSpecs?: TechnicalSpecFilters;
  includeFilters?: string | boolean;
  includeItems?: string | boolean;
};

export type PlpListingMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  nextCursor: string | null;
  totalIsExact: boolean;
};

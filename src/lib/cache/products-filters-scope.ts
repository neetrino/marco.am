import type { TechnicalSpecFilters } from '@/lib/services/products-find-query/types';
import { hasTechnicalSpecFilters } from '@/lib/services/products-technical-filters';

export const PRODUCTS_FILTERS_BASE_CACHE_TTL_SEC = 600;

export function buildProductsFiltersBaseCacheKey(lang: string): string {
  return `cache:products:filters:base:v1:${lang.trim().toLowerCase()}`;
}

export function isUnscopedShopFiltersScope(args: {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  technicalSpecs?: TechnicalSpecFilters;
}): boolean {
  if (args.category?.trim() || args.search?.trim() || args.filter?.trim()) {
    return false;
  }
  if (args.minPrice !== undefined || args.maxPrice !== undefined) {
    return false;
  }
  return !hasTechnicalSpecFilters(args.technicalSpecs ?? {});
}

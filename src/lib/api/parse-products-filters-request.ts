import type { NextRequest } from 'next/server';
import type { TechnicalSpecFilters } from '@/lib/services/products-find-query/types';
import { parseTechnicalSpecFiltersFromSearchParams } from '@/lib/services/products-technical-filters';

export type ParsedProductsFiltersRequest = {
  category?: string;
  search?: string;
  filter?: string;
  includeCategories?: boolean;
  categoriesOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  lang: string;
  technicalSpecs: TechnicalSpecFilters;
};

function parseBooleanFlag(raw: string | null): boolean | undefined {
  if (raw === null) {
    return undefined;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no') {
    return false;
  }
  return undefined;
}

function parseOptionalPrice(raw: string | null): number | undefined {
  const parsed = raw ? Number(raw) : undefined;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseProductsFiltersRequest(req: NextRequest): ParsedProductsFiltersRequest {
  const searchParams = new URL(req.url || '').searchParams;
  return {
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    filter: searchParams.get('filter') || undefined,
    includeCategories: parseBooleanFlag(searchParams.get('includeCategories')),
    categoriesOnly: parseBooleanFlag(searchParams.get('categoriesOnly')),
    minPrice: parseOptionalPrice(searchParams.get('minPrice')),
    maxPrice: parseOptionalPrice(searchParams.get('maxPrice')),
    lang: searchParams.get('lang') || 'en',
    technicalSpecs: parseTechnicalSpecFiltersFromSearchParams(searchParams),
  };
}

export const PRODUCTS_FILTERS_API_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=180';

export const PRODUCTS_FILTERS_SHELL_CACHE_CONTROL = 'public, max-age=120, stale-while-revalidate=300';

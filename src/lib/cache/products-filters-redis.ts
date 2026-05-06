import { createHash } from 'node:crypto';
import type { TechnicalSpecFilters } from '@/lib/services/products-find-query/types';
import { productsService } from '@/lib/services/products.service';
import { parseTechnicalSpecFiltersFromSearchParams } from '@/lib/services/products-technical-filters';
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { stableStringifyForCacheKey } from '@/lib/cache/stable-stringify';

export const PRODUCTS_FILTERS_CACHE_TTL_SEC = 120;

export type ProductsFiltersCachedPayload = Awaited<
  ReturnType<typeof productsService.getFilters>
>;

export function searchParamsRecordToUrlSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) {
      continue;
    }
    const s = Array.isArray(value) ? value[0] : value;
    if (s !== undefined && s !== '') {
      q.set(key, s);
    }
  }
  return q;
}

/**
 * Stable Redis key aligned with `GET /api/v1/products/filters` — `cache:products:filters:v1:{sha256}`.
 */
export function buildProductsFiltersCacheKey(filters: {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  lang: string;
  technicalSpecs: TechnicalSpecFilters;
}): string {
  const hash = createHash('sha256')
    .update(stableStringifyForCacheKey(filters))
    .digest('hex');
  return `cache:products:filters:v2:${hash}`;
}

export async function getProductsFiltersCached(args: {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  lang: string;
  /** Precomputed (e.g. API route) — must match `parseTechnicalSpecFiltersFromSearchParams` for the same request. */
  technicalSpecs?: TechnicalSpecFilters;
  /** PLP `searchParams` record — used when `technicalSpecs` is omitted. */
  rawSearchParams?: Record<string, string | string[] | undefined>;
}): Promise<ProductsFiltersCachedPayload> {
  const technicalSpecs =
    args.technicalSpecs ??
    parseTechnicalSpecFiltersFromSearchParams(
      args.rawSearchParams
        ? searchParamsRecordToUrlSearchParams(args.rawSearchParams)
        : new URLSearchParams(),
    );
  const keyPayload = {
    category: args.category?.trim() || undefined,
    search: args.search?.trim() || undefined,
    filter: args.filter?.trim() || undefined,
    minPrice: args.minPrice,
    maxPrice: args.maxPrice,
    lang: args.lang,
    technicalSpecs,
  };
  const cacheKey = buildProductsFiltersCacheKey(keyPayload);
  return getCachedJson<ProductsFiltersCachedPayload>(
    cacheKey,
    PRODUCTS_FILTERS_CACHE_TTL_SEC,
    () =>
      productsService.getFilters({
        category: keyPayload.category,
        search: keyPayload.search,
        filter: keyPayload.filter,
        minPrice: keyPayload.minPrice,
        maxPrice: keyPayload.maxPrice,
        lang: keyPayload.lang,
        technicalSpecs: keyPayload.technicalSpecs,
      }),
  );
}

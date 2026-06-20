import type { TechnicalSpecFilters } from '@/lib/services/products-find-query/types';
import type { PlpReadModelSearchParams } from './products-plp-read-model-types';

/** Backstop TTL on top of on-demand invalidation (projection rebuild clears the cache). */
export const PRODUCTS_PLP_CACHE_TTL_SEC = 120;

const PLP_LISTING_CACHE_PREFIX = 'cache:products:plp:v1';
const PLP_FILTERS_CACHE_PREFIX = 'cache:products:filters:v1';

function normalizeToken(value: string | undefined): string {
  return value?.trim() ?? '';
}

function stableTechnicalSpecs(specs: TechnicalSpecFilters | undefined): string {
  if (!specs) {
    return '';
  }
  return Object.keys(specs)
    .sort()
    .map((key) => `${key}=${[...specs[key]].sort().join(',')}`)
    .join('|');
}

/**
 * Skip cache for high-cardinality / unique queries: free-text `search` (unbounded keys)
 * and `ids` lookups (compare/wishlist hydration — unique per request).
 */
export function shouldSkipPlpCache(params: PlpReadModelSearchParams): boolean {
  return Boolean(normalizeToken(params.ids)) || Boolean(normalizeToken(params.search));
}

function buildFilterScopeParts(params: PlpReadModelSearchParams): string[] {
  return [
    `lang:${normalizeToken(params.lang) || 'en'}`,
    `cat:${normalizeToken(params.category)}`,
    `brand:${normalizeToken(params.brand)}`,
    `colors:${normalizeToken(params.colors)}`,
    `sizes:${normalizeToken(params.sizes)}`,
    `min:${normalizeToken(params.minPrice)}`,
    `max:${normalizeToken(params.maxPrice)}`,
    `filter:${normalizeToken(params.filter)}`,
    `pp:${normalizeToken(params.pricePresence)}`,
    `specs:${stableTechnicalSpecs(params.technicalSpecs)}`,
  ];
}

/** Facets depend only on the active filter scope + locale (not page/sort/limit). */
export function buildPlpFiltersCacheKey(params: PlpReadModelSearchParams): string {
  return `${PLP_FILTERS_CACHE_PREFIX}:${buildFilterScopeParts(params).join('|')}`;
}

/** Listing items additionally depend on page/limit/sort. */
export function buildPlpListingCacheKey(params: PlpReadModelSearchParams): string {
  const parts = [
    ...buildFilterScopeParts(params),
    `sort:${normalizeToken(params.sort)}`,
    `page:${normalizeToken(params.page) || '1'}`,
    `limit:${normalizeToken(params.limit)}`,
  ];
  return `${PLP_LISTING_CACHE_PREFIX}:${parts.join('|')}`;
}

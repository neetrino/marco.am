import { createHash } from 'node:crypto';
import type { ProductFilters } from '@/lib/services/products-find-query/types';
import { stableStringifyForCacheKey } from '@/lib/cache/stable-stringify';
import { buildProductsListingScopeFingerprint } from '@/lib/cache/products-listing-scope-fingerprint';

const PRODUCTS_LIST_CACHE_VERSION = 'v10';
const PRODUCTS_COUNT_CACHE_VERSION = 'v1';

export function buildProductsListingRedisKey(filters: ProductFilters): string {
  const fingerprint = {
    ...buildProductsListingScopeFingerprint(filters),
    sort: filters.sort ?? null,
    page: filters.page ?? 1,
    limit: filters.limit ?? 12,
    cursor: filters.cursor ?? null,
  };
  const hash = createHash('sha256')
    .update(stableStringifyForCacheKey(fingerprint))
    .digest('hex');
  return `cache:products:list:${PRODUCTS_LIST_CACHE_VERSION}:${hash}`;
}

export function buildProductsListingCountRedisKey(filters: ProductFilters): string {
  const hash = createHash('sha256')
    .update(stableStringifyForCacheKey(buildProductsListingScopeFingerprint(filters)))
    .digest('hex');
  return `cache:products:count:${PRODUCTS_COUNT_CACHE_VERSION}:${hash}`;
}

import { db } from '@white-shop/db';
import type { ProductFilters } from '@/lib/services/products-find-query/types';
import { buildWhereClause } from '@/lib/services/products-find-query/query-builder';
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { buildProductsListingCountRedisKey } from '@/lib/cache/products-listing-cache-keys';
import { resolveProductsListingTtlSeconds } from '@/lib/cache/products-listing-count-ttl';

export { buildProductsListingCountRedisKey };

/**
 * Cached `db.product.count` for a listing filter scope (shared across pages/sorts).
 */
export async function getProductsListingCountCached(filters: ProductFilters): Promise<number> {
  const key = buildProductsListingCountRedisKey(filters);
  const ttl = resolveProductsListingTtlSeconds(filters);
  return getCachedJson<number>(
    key,
    ttl,
    async () => {
      const { where } = await buildWhereClause(filters);
      if (where === null) {
        return 0;
      }
      return db.product.count({ where });
    },
    { requireSharedCache: true },
  );
}

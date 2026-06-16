import type { ProductFilters } from '@/lib/services/products-find-query/types';
import { productsFindService } from '@/lib/services/products-find.service';
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { buildProductsListingRedisKey } from '@/lib/cache/products-listing-cache-keys';
import { resolveProductsListingTtlSeconds } from '@/lib/cache/products-listing-count-ttl';

export type ProductsListingPayload = Awaited<ReturnType<typeof productsFindService.findAll>>;

export { buildProductsListingRedisKey, resolveProductsListingTtlSeconds };

export async function getProductsListingCached(
  filters: ProductFilters,
): Promise<ProductsListingPayload> {
  const key = buildProductsListingRedisKey(filters);
  const ttl = resolveProductsListingTtlSeconds(filters);
  return getCachedJson<ProductsListingPayload>(key, ttl, () => productsFindService.findAll(filters), {
    requireSharedCache: true,
  });
}

import { createHash } from 'node:crypto';
import type { ProductFilters } from '@/lib/services/products-find-query/types';
import { productsService } from '@/lib/services/products.service';
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { stableStringifyForCacheKey } from '@/lib/cache/stable-stringify';

const PRODUCTS_LIST_CACHE_VERSION = 'v5';
const PRODUCTS_CACHE_TTL = 120;
const FEATURED_CACHE_TTL = 600;

export type ProductsListingPayload = Awaited<ReturnType<typeof productsService.findAll>>;

function normalizeSpecsForKey(specs: ProductFilters['technicalSpecs']): Record<string, string[]> {
  if (!specs || typeof specs !== 'object') {
    return {};
  }
  const out: Record<string, string[]> = {};
  for (const key of Object.keys(specs).sort()) {
    const arr = specs[key];
    if (!Array.isArray(arr)) {
      continue;
    }
    out[key] = [...arr].map((s) => String(s)).sort();
  }
  return out;
}

/**
 * Deterministic Redis key: `cache:products:list:{version}:{sha256}`.
 */
export function buildProductsListingRedisKey(filters: ProductFilters): string {
  const productIds = filters.productIds?.length
    ? [...filters.productIds].sort()
    : undefined;
  const fingerprint = {
    category: filters.category ?? null,
    search: filters.search ?? null,
    filter: filters.filter ?? null,
    minPrice: filters.minPrice ?? null,
    maxPrice: filters.maxPrice ?? null,
    colors: filters.colors ?? null,
    sizes: filters.sizes ?? null,
    brand: filters.brand ?? null,
    sort: filters.sort ?? null,
    page: filters.page ?? 1,
    limit: filters.limit ?? 12,
    cursor: filters.cursor ?? null,
    lang: filters.lang ?? 'en',
    technicalSpecs: normalizeSpecsForKey(filters.technicalSpecs),
    productIds: productIds ?? null,
    listingOmitProductAttributes: Boolean(filters.listingOmitProductAttributes),
    cardVisualOnly: Boolean(filters.cardVisualOnly),
  };
  const hash = createHash('sha256')
    .update(stableStringifyForCacheKey(fingerprint))
    .digest('hex');
  return `cache:products:list:${PRODUCTS_LIST_CACHE_VERSION}:${hash}`;
}

export function resolveProductsListingTtlSeconds(filters: ProductFilters): number {
  const onlyFeatured =
    Boolean(filters.filter) &&
    ['new', 'bestseller', 'featured', 'promotion', 'special_offer'].includes(String(filters.filter)) &&
    !filters.category &&
    !filters.search &&
    (filters.limit ?? 12) <= 24;
  return onlyFeatured ? FEATURED_CACHE_TTL : PRODUCTS_CACHE_TTL;
}

export async function getProductsListingCached(
  filters: ProductFilters,
): Promise<ProductsListingPayload> {
  const key = buildProductsListingRedisKey(filters);
  const ttl = resolveProductsListingTtlSeconds(filters);
  return getCachedJson<ProductsListingPayload>(key, ttl, () => productsService.findAll(filters));
}

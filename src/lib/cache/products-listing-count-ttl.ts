import type { ProductFilters } from '@/lib/services/products-find-query/types';
import { isDefaultShopPlpListing } from '@/lib/cache/shop-plp-listing-cache-policy';

const PRODUCTS_CACHE_TTL = 120;
const FEATURED_CACHE_TTL = 600;
const DEFAULT_PLP_CACHE_TTL = 300;

/** TTL for listing payloads and scoped product counts. */
export function resolveProductsListingTtlSeconds(filters: ProductFilters): number {
  if (isDefaultShopPlpListing(filters) && filters.plpLeanListing) {
    return DEFAULT_PLP_CACHE_TTL;
  }
  const onlyFeatured =
    Boolean(filters.filter) &&
    ['new', 'bestseller', 'featured', 'promotion', 'special_offer'].includes(String(filters.filter)) &&
    !filters.category &&
    !filters.search &&
    (filters.limit ?? 12) <= 24;
  return onlyFeatured ? FEATURED_CACHE_TTL : PRODUCTS_CACHE_TTL;
}

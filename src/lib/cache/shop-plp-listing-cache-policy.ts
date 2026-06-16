import type { ProductFilters } from '@/lib/services/products-find-query/types';
import { hasTechnicalSpecFilters } from '@/lib/services/products-technical-filters';
import { SHOP_PLP_DEFAULT_PAGE_SIZE } from '@/lib/constants/shop-plp-pagination';

const DEFAULT_PLP_SORT_KEYS = new Set(['default', 'createdAt', 'createdAt-desc', undefined]);

/** Unfiltered default `/products` first page — safe for longer Redis TTL. */
export function isDefaultShopPlpListing(filters: ProductFilters): boolean {
  return (
    (filters.page ?? 1) === 1 &&
    (filters.limit ?? SHOP_PLP_DEFAULT_PAGE_SIZE) <= SHOP_PLP_DEFAULT_PAGE_SIZE &&
    !filters.category &&
    !filters.search &&
    !filters.filter &&
    !filters.brand &&
    !filters.colors &&
    !filters.sizes &&
    filters.minPrice === undefined &&
    filters.maxPrice === undefined &&
    !filters.productIds?.length &&
    filters.cursor === undefined &&
    !hasTechnicalSpecFilters(filters.technicalSpecs) &&
    DEFAULT_PLP_SORT_KEYS.has(filters.sort)
  );
}

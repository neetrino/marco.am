/**
 * Default page size for `/products` when the `limit` query param is omitted.
 * Pagination URLs set `limit` to this value so page changes keep the same page size.
 */
export const SHOP_PLP_DEFAULT_PAGE_SIZE = 21;
export const SHOP_PLP_MAX_PAGE_SIZE = 60;

/** @deprecated Use {@link resolveShopPlpLcpImagePriorityCount} — mobile/desktop counts differ. */
export const SHOP_PLP_LCP_IMAGE_PRIORITY_COUNT = 6;

export const SHOP_PLP_LCP_IMAGE_PRIORITY_COUNT_MOBILE = 2;
export const SHOP_PLP_LCP_IMAGE_PRIORITY_COUNT_DESKTOP = 4;

/** Max PLP rows seeded into PDP cache per idle/viewport batch. */
export const PLP_PDP_CACHE_SYNC_BATCH_SIZE = 8;

/** Resolve how many above-the-fold PLP images get `priority` loading. */
export function resolveShopPlpLcpImagePriorityCount(isMobileViewport: boolean): number {
  return isMobileViewport
    ? SHOP_PLP_LCP_IMAGE_PRIORITY_COUNT_MOBILE
    : SHOP_PLP_LCP_IMAGE_PRIORITY_COUNT_DESKTOP;
}

/** Max products loaded for in-memory PLP sort/filter (price, specs, popular). */
export const PLP_IN_MEMORY_SORT_OVERFETCH_MAX = 120;

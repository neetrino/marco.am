/**
 * Default page size for `/products` when the `limit` query param is omitted.
 * Pagination URLs set `limit` to this value so page changes keep the same page size.
 */
export const SHOP_PLP_DEFAULT_PAGE_SIZE = 21;
export const SHOP_PLP_MAX_PAGE_SIZE = 60;

/** First N PLP cards use `priority` image loading for faster LCP. */
export const SHOP_PLP_LCP_IMAGE_PRIORITY_COUNT = 6;

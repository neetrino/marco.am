/**
 * Query params for `/api/v1/products` on home strips — mirrors SSR `getProductsListingCached` lean path.
 */
export const HOME_STRIP_LISTING_API_FLAGS = {
  omitProductAttributes: '1',
  skipExactTotalCount: '1',
  homeStripListing: '1',
} as const;

export function buildHomeStripListingApiParams(
  overrides: Record<string, string>,
): Record<string, string> {
  return {
    page: '1',
    ...HOME_STRIP_LISTING_API_FLAGS,
    ...overrides,
  };
}

/** First N home rail cards use eager image loading (above-the-fold LCP only). */
export const HOME_RAIL_LCP_IMAGE_PRIORITY_COUNT = 2;

/** True when a home product tile should use `priority` / eager image loading. */
export function isHomeRailAboveFoldImage(pageIndex: number, slotIndex: number): boolean {
  return pageIndex === 0 && slotIndex < HOME_RAIL_LCP_IMAGE_PRIORITY_COUNT;
}

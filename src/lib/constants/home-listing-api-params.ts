import type { PlpReadModelSearchParams } from '@/lib/read-model/products-plp-read-model-types';

/**
 * Query params for `/api/v1/products/plp` on home strips — mirrors SSR read-model lean path.
 */
const HOME_STRIP_LISTING_API_FLAGS = {
  omitProductAttributes: '1',
  skipExactTotalCount: '1',
  homeStripListing: '1',
  includeFilters: '0',
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

/** Maps read-model listing params to home strip API query fields. */
export function plpParamsToHomeApiQuery(params: PlpReadModelSearchParams): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.lang) {
    query.lang = params.lang;
  }
  if (params.page) {
    query.page = params.page;
  }
  if (params.limit) {
    query.limit = params.limit;
  }
  if (params.sort) {
    query.sort = params.sort;
  }
  if (params.filter) {
    query.filter = params.filter;
  }
  if (params.includeFilters !== undefined) {
    query.includeFilters = String(params.includeFilters);
  }
  return query;
}

/** First N home rail cards use eager image loading (above-the-fold LCP only). */
export const HOME_RAIL_LCP_IMAGE_PRIORITY_COUNT = 2;

/** True when a home product tile should use `priority` / eager image loading. */
export function isHomeRailAboveFoldImage(pageIndex: number, slotIndex: number): boolean {
  return pageIndex === 0 && slotIndex < HOME_RAIL_LCP_IMAGE_PRIORITY_COUNT;
}

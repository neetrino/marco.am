import { apiClient } from '@/lib/api-client';
import { SHOP_PLP_DEFAULT_PAGE_SIZE } from '@/lib/constants/shop-plp-pagination';
import { getStoredLanguage } from '@/lib/language';
import { buildShopListingApiParams } from '@/lib/shop-products-listing-api-params';
import {
  readShopListingCache,
  writeShopListingCache,
  type ShopListingCachePayload,
} from '@/lib/shop-products-listing-client-cache';

type ListingApiResponse = ShopListingCachePayload & {
  items?: ShopListingCachePayload['data'];
  pagination?: ShopListingCachePayload['meta'];
};

const adjacentPrefetchInFlight = new Set<string>();

function buildPageQueryString(queryString: string, page: number): string {
  const params = new URLSearchParams(queryString);
  params.set('page', String(page));
  if (!params.has('limit')) {
    params.set('limit', String(SHOP_PLP_DEFAULT_PAGE_SIZE));
  }
  return params.toString();
}

function prefetchListingPageIntoCache(queryString: string): void {
  if (readShopListingCache(queryString) || adjacentPrefetchInFlight.has(queryString)) {
    return;
  }
  adjacentPrefetchInFlight.add(queryString);
  void apiClient
    .get<ListingApiResponse>('/api/v1/products', {
      params: buildShopListingApiParams(queryString, getStoredLanguage()),
      suppressNetworkErrorLogging: true,
    })
    .then((response) => {
      writeShopListingCache(queryString, {
        data: response.data ?? response.items ?? [],
        meta: response.meta ??
          response.pagination ?? {
            total: 0,
            page: 1,
            limit: SHOP_PLP_DEFAULT_PAGE_SIZE,
            totalPages: 0,
          },
      });
    })
    .catch(() => {
      /* Best-effort prefetch — pagination will fetch on demand if this fails. */
    })
    .finally(() => {
      adjacentPrefetchInFlight.delete(queryString);
    });
}

/**
 * Warms next/previous PLP pages into the session cache so sequential pagination
 * paints instantly from cache instead of waiting on a fresh listing fetch.
 */
export function prefetchAdjacentShopListingPages(
  queryString: string,
  currentPage: number,
  totalPages: number,
): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (currentPage < totalPages) {
    prefetchListingPageIntoCache(buildPageQueryString(queryString, currentPage + 1));
  }
  if (currentPage > 1) {
    prefetchListingPageIntoCache(buildPageQueryString(queryString, currentPage - 1));
  }
}

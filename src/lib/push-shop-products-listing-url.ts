import {
  dispatchShopProductsListingParams,
} from '@/lib/shop-products-listing-params-event';
import { syncShopProductsListingQueryString } from '@/lib/use-shop-products-listing-search-params';

type ShopListingRouter = {
  push: (href: string, options?: { scroll?: boolean }) => void | Promise<void>;
  refresh: () => void;
};

/**
 * Update the shop listing URL without an App Router navigation (no RSC refetch).
 * Dispatches an instant client fetch event, then syncs the address bar via history API.
 */
export function pushShopProductsListingUrl(_router: ShopListingRouter, href: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const currentUrl = new URL(window.location.href);
  const targetUrl = new URL(href, window.location.origin);
  if (currentUrl.pathname === targetUrl.pathname && currentUrl.search === targetUrl.search) {
    return;
  }

  dispatchShopProductsListingParams(href);
  const queryString = targetUrl.search.startsWith('?')
    ? targetUrl.search.slice(1)
    : targetUrl.search;
  syncShopProductsListingQueryString(queryString);
  window.history.pushState(null, '', href);
}

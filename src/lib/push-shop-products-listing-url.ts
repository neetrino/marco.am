import {
  dispatchShopProductsListingParams,
} from '@/lib/shop-products-listing-params-event';
import { notifyShopProductsListingFetch } from '@/lib/shop-products-listing-client-cache';
import { syncShopProductsListingQueryString } from '@/lib/use-shop-products-listing-search-params';

type ShopListingRouter = {
  push: (href: string, options?: { scroll?: boolean }) => void | Promise<void>;
  refresh: () => void;
};

const SHOP_PRODUCTS_LISTING_PATH = '/products';

function isOnShopProductsListingPage(pathname: string): boolean {
  return pathname === SHOP_PRODUCTS_LISTING_PATH;
}

/**
 * Navigate to the shop listing. On `/products`, updates query via history (no RSC refetch).
 * From any other route (e.g. home), uses App Router so the PLP actually mounts.
 */
export function pushShopProductsListingUrl(router: ShopListingRouter, href: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const currentUrl = new URL(window.location.href);
  const targetUrl = new URL(href, window.location.origin);
  if (currentUrl.pathname === targetUrl.pathname && currentUrl.search === targetUrl.search) {
    return;
  }

  if (!isOnShopProductsListingPage(currentUrl.pathname)) {
    void router.push(href);
    return;
  }

  const queryString = targetUrl.search.startsWith('?')
    ? targetUrl.search.slice(1)
    : targetUrl.search;

  notifyShopProductsListingFetch(queryString);
  dispatchShopProductsListingParams(href);
  syncShopProductsListingQueryString(queryString);
  window.history.pushState(null, '', href);
}

/** Fired before Next.js navigation so the PLP grid can fetch immediately from the API. */
export const SHOP_PRODUCTS_LISTING_PARAMS_EVENT = 'shop-products-listing-params';

export type ShopProductsListingParamsDetail = {
  href: string;
  queryString: string;
};

export function dispatchShopProductsListingParams(href: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const targetUrl = new URL(href, window.location.origin);
  const queryString = targetUrl.search.startsWith('?')
    ? targetUrl.search.slice(1)
    : targetUrl.search;
  window.dispatchEvent(
    new CustomEvent<ShopProductsListingParamsDetail>(SHOP_PRODUCTS_LISTING_PARAMS_EVENT, {
      detail: { href, queryString },
    }),
  );
}

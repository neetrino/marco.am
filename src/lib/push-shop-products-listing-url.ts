/**
 * Navigate to the shop listing (`/products` or `/products?…`) and refetch server
 * components so the grid and meta match the URL after client-side navigation.
 */
export function pushShopProductsListingUrl(
  router: { push: (href: string) => void | Promise<void>; refresh: () => void },
  href: string,
): void {
  void router.push(href);
  router.refresh();
}

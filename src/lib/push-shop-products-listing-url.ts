import { startTransition } from "react";

/**
 * Navigate to the shop listing (`/products` or `/products?…`) and refetch server
 * components so the grid and meta match the URL after client-side navigation.
 */
export function pushShopProductsListingUrl(
  router: { push: (href: string) => void | Promise<void>; refresh: () => void },
  href: string,
): void {
  if (typeof window !== 'undefined') {
    const currentUrl = new URL(window.location.href);
    const targetUrl = new URL(href, window.location.origin);
    const isSameRoute =
      currentUrl.pathname === targetUrl.pathname && currentUrl.search === targetUrl.search;

    if (isSameRoute) {
      startTransition(() => {
        router.refresh();
      });
      return;
    }
  }

  startTransition(() => {
    void router.push(href);
  });
}

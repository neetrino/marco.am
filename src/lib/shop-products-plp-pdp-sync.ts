import type { QueryClient } from '@tanstack/react-query';

import type { ShopGridProduct } from '@/app/products/shop-grid-product';
import type { LanguageCode } from '@/lib/language';
import { writeProductPdpQueryCache } from '@/lib/product-pdp/pdp-navigation-seed-cache';
import { shopGridProductToPdpNavigationSeed } from '@/lib/shop-grid-product-pdp-seed';
import { writeShopProductsCache } from '@/lib/shop-products-cache-store';

/** Writes PLP rows into slug store + React Query PDP keys for 0ms navigation. */
export function syncShopListingProductsToPdpCache(
  queryClient: QueryClient,
  products: readonly ShopGridProduct[],
  language: LanguageCode,
): void {
  if (products.length === 0) {
    return;
  }

  writeShopProductsCache(products, language);

  for (const product of products) {
    if (!product.slug) {
      continue;
    }
    writeProductPdpQueryCache({
      queryClient,
      slug: product.slug,
      language,
      navigationSeed: shopGridProductToPdpNavigationSeed(product),
    });
  }
}

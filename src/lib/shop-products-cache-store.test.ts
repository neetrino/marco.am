import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import type { ShopGridProduct } from '@/app/products/shop-grid-product';
import { shopGridProductToPdpNavigationSeed } from '@/lib/shop-grid-product-pdp-seed';
import { buildProductFromPdpNavigationSeed } from '@/lib/product-pdp/pdp-navigation-seed';
import { resolvePdpInitialFromListingCache, resolvePdpInstantShell } from '@/lib/product-pdp/resolve-pdp-listing-shell';
import { queryKeys } from '@/lib/query-keys';
import {
  getShopProductBySlug,
  writeShopProductsCache,
} from '@/lib/shop-products-cache-store';
import { syncShopListingProductsToPdpCache } from '@/lib/shop-products-plp-pdp-sync';

const sampleProduct: ShopGridProduct = {
  id: 'prod-1',
  slug: 'sample-slug',
  title: 'Sample product',
  price: 1000,
  compareAtPrice: 1200,
  image: 'https://example.com/image.jpg',
  images: [
    'https://example.com/image.jpg',
    'https://example.com/image-2.jpg',
  ],
  inStock: true,
  brand: { id: 'brand-1', slug: 'brand', name: 'Brand', logoUrl: null },
  defaultVariantId: null,
  colors: [],
  labels: [],
  categories: [{ id: 'cat-1', slug: 'cat', title: 'Category' }],
};

describe('shop-products-cache-store', () => {
  it('stores and retrieves products by slug', () => {
    writeShopProductsCache([sampleProduct], 'en');
    expect(getShopProductBySlug('sample-slug')).toEqual(sampleProduct);
    expect(getShopProductBySlug('missing')).toBeNull();
  });
});

describe('syncShopListingProductsToPdpCache', () => {
  it('seeds React Query PDP keys from listing rows', () => {
    const queryClient = new QueryClient();
    syncShopListingProductsToPdpCache(queryClient, [sampleProduct], 'en');

    const cached = queryClient.getQueryData(
      queryKeys.productDetail('sample-slug', 'en'),
    );
    expect(cached).toEqual(
      buildProductFromPdpNavigationSeed(shopGridProductToPdpNavigationSeed(sampleProduct)),
    );
  });
});

describe('resolvePdpInitialFromListingCache', () => {
  it('prefers React Query cache over slug store', () => {
    const queryClient = new QueryClient();
    const shell = buildProductFromPdpNavigationSeed(
      shopGridProductToPdpNavigationSeed(sampleProduct),
    );
    queryClient.setQueryData(queryKeys.productDetail('sample-slug', 'en'), shell);

    expect(resolvePdpInitialFromListingCache('sample-slug', 'en', queryClient)).toEqual(shell);
  });

  it('falls back to slug store when query cache is empty', () => {
    const queryClient = new QueryClient();
    writeShopProductsCache([sampleProduct], 'en');

    expect(resolvePdpInitialFromListingCache('sample-slug', 'en', queryClient)).toEqual(
      buildProductFromPdpNavigationSeed(shopGridProductToPdpNavigationSeed(sampleProduct)),
    );
  });
});

describe('resolvePdpInstantShell', () => {
  it('returns slug store shell when query cache is empty', () => {
    const queryClient = new QueryClient();
    writeShopProductsCache([sampleProduct], 'en');

    expect(resolvePdpInstantShell('sample-slug', 'en', queryClient)).toEqual(
      buildProductFromPdpNavigationSeed(shopGridProductToPdpNavigationSeed(sampleProduct)),
    );
  });
});

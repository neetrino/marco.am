import { describe, expect, it } from 'vitest';

import {
  buildProductFromPdpNavigationSeed,
  resolveNavigationSeedImages,
  type ProductPdpNavigationSeed,
} from '@/lib/product-pdp/pdp-navigation-seed';
import { isPdpListingShell } from '@/lib/product-pdp/resolve-pdp-listing-shell';
import type { Product } from '@/app/products/[slug]/types';

const baseSeed: ProductPdpNavigationSeed = {
  id: 'p1',
  slug: 'sample-product',
  title: 'Sample',
  image: 'https://cdn.example.com/hero.jpg',
  images: [
    'https://cdn.example.com/2.png',
    'https://cdn.example.com/3.png',
    'https://cdn.example.com/4.png',
  ],
  brand: { id: 'b1', name: 'Brand' },
  price: 1000,
  inStock: true,
};

describe('resolveNavigationSeedImages', () => {
  it('prefers images array over single hero', () => {
    expect(
      resolveNavigationSeedImages(baseSeed.image, baseSeed.images),
    ).toEqual(baseSeed.images);
  });

  it('falls back to single image when images missing', () => {
    expect(resolveNavigationSeedImages('https://cdn.example.com/a.jpg')).toEqual([
      'https://cdn.example.com/a.jpg',
    ]);
  });

  it('returns empty array when no images', () => {
    expect(resolveNavigationSeedImages(null)).toEqual([]);
  });
});

describe('buildProductFromPdpNavigationSeed', () => {
  it('maps full gallery into shell product media', () => {
    const shell = buildProductFromPdpNavigationSeed(baseSeed);
    expect(shell.media).toEqual(baseSeed.images);
    expect(shell.variants).toEqual([]);
    expect(isPdpListingShell(shell)).toBe(true);
  });

  it('treats product with description but no variants as non-shell', () => {
    const full: Product = {
      ...buildProductFromPdpNavigationSeed(baseSeed),
      description: [{ title: '', value: 'Long enough product description note for PDP shell test.' }],
      variants: [],
    };
    expect(isPdpListingShell(full)).toBe(false);
  });

  it('treats product with variants as non-shell', () => {
    const withVariants: Product = {
      ...buildProductFromPdpNavigationSeed(baseSeed),
      variants: [
        {
          id: 'v1',
          sku: 'SKU-1',
          price: 1000,
          stock: 5,
          available: true,
          options: [],
        },
      ],
    };
    expect(isPdpListingShell(withVariants)).toBe(false);
  });
});

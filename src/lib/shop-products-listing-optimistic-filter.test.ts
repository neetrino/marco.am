import { describe, expect, it } from 'vitest';
import { buildAllowedCategorySlugs } from '@/lib/shop-category-filter-descendant-slugs';
import { applyOptimisticShopListingFilter } from '@/lib/shop-products-listing-optimistic-filter';
import type { ShopGridProduct } from '@/app/products/shop-grid-product';

const categoryTree = [
  {
    slug: 'electronics',
    children: [
      { slug: 'phones', children: [] },
      { slug: 'laptops', children: [] },
    ],
  },
];

const sampleProducts: ShopGridProduct[] = [
  {
    id: '1',
    slug: 'phone-a',
    title: 'Phone A',
    price: 100,
    compareAtPrice: null,
    image: null,
    inStock: true,
    brand: null,
    defaultVariantId: null,
    colors: [],
    labels: [],
    categories: [{ id: 'c1', slug: 'phones', title: 'Phones' }],
  },
  {
    id: '2',
    slug: 'laptop-a',
    title: 'Laptop A',
    price: 200,
    compareAtPrice: null,
    image: null,
    inStock: true,
    brand: null,
    defaultVariantId: null,
    colors: [],
    labels: [],
    categories: [{ id: 'c2', slug: 'laptops', title: 'Laptops' }],
  },
  {
    id: '3',
    slug: 'other',
    title: 'Other',
    price: 50,
    compareAtPrice: null,
    image: null,
    inStock: true,
    brand: null,
    defaultVariantId: null,
    colors: [],
    labels: [],
    categories: [{ id: 'c3', slug: 'home', title: 'Home' }],
  },
];

describe('buildAllowedCategorySlugs', () => {
  it('includes descendants for a parent category slug', () => {
    const allowed = buildAllowedCategorySlugs(categoryTree, ['electronics']);
    expect(allowed.has('electronics')).toBe(true);
    expect(allowed.has('phones')).toBe(true);
    expect(allowed.has('laptops')).toBe(true);
  });
});

describe('applyOptimisticShopListingFilter', () => {
  it('filters by parent category and returns an empty array when nothing matches', () => {
    const filtered = applyOptimisticShopListingFilter(
      sampleProducts,
      'category=electronics',
      '',
      categoryTree,
    );

    expect(filtered).toEqual([sampleProducts[0], sampleProducts[1]]);
  });

  it('returns an empty array instead of null when category filter has no matches', () => {
    const filtered = applyOptimisticShopListingFilter(
      [{ ...sampleProducts[0]!, categories: [{ id: 'x', slug: 'home', title: 'Home' }] }],
      'category=phones',
      '',
      categoryTree,
    );

    expect(filtered).toEqual([]);
  });

  it('still returns null for unsupported query changes such as search', () => {
    const filtered = applyOptimisticShopListingFilter(
      sampleProducts,
      'search=phone',
      '',
      categoryTree,
    );

    expect(filtered).toBeNull();
  });
});

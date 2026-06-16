import { describe, expect, it } from 'vitest';
import { buildProductsListingCountRedisKey } from '@/lib/cache/products-listing-cache-keys';
import { buildProductsListingRedisKey } from '@/lib/cache/products-listing-cache-keys';
import { SHOP_PLP_DEFAULT_PAGE_SIZE } from '@/lib/constants/shop-plp-pagination';

describe('products listing cache keys', () => {
  const scope = {
    page: 1,
    limit: SHOP_PLP_DEFAULT_PAGE_SIZE,
    lang: 'hy',
    plpLeanListing: true,
    listingOmitProductAttributes: true,
  };

  it('uses the same count key for different pages in the same scope', () => {
    const countA = buildProductsListingCountRedisKey({ ...scope, page: 1 });
    const countB = buildProductsListingCountRedisKey({ ...scope, page: 3 });
    expect(countA).toBe(countB);
  });

  it('uses different list keys for different pages', () => {
    const listA = buildProductsListingRedisKey({ ...scope, page: 1 });
    const listB = buildProductsListingRedisKey({ ...scope, page: 3 });
    expect(listA).not.toBe(listB);
  });

  it('uses different count keys when category scope changes', () => {
    const all = buildProductsListingCountRedisKey(scope);
    const phones = buildProductsListingCountRedisKey({ ...scope, category: 'phones' });
    expect(all).not.toBe(phones);
  });
});

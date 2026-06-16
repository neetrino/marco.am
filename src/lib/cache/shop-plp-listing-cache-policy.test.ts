import { describe, expect, it } from 'vitest';
import { isDefaultShopPlpListing } from '@/lib/cache/shop-plp-listing-cache-policy';
import { SHOP_PLP_DEFAULT_PAGE_SIZE } from '@/lib/constants/shop-plp-pagination';

describe('isDefaultShopPlpListing', () => {
  it('matches unfiltered page 1 default PLP', () => {
    expect(
      isDefaultShopPlpListing({
        page: 1,
        limit: SHOP_PLP_DEFAULT_PAGE_SIZE,
        plpLeanListing: true,
        listingOmitProductAttributes: true,
        sort: 'default',
      }),
    ).toBe(true);
  });

  it('rejects category-scoped listings', () => {
    expect(
      isDefaultShopPlpListing({
        page: 1,
        limit: SHOP_PLP_DEFAULT_PAGE_SIZE,
        category: 'phones',
        plpLeanListing: true,
      }),
    ).toBe(false);
  });

  it('rejects price sort listings', () => {
    expect(
      isDefaultShopPlpListing({
        page: 1,
        limit: SHOP_PLP_DEFAULT_PAGE_SIZE,
        sort: 'price-asc',
        plpLeanListing: true,
      }),
    ).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { buildShopListingApiParams } from '@/lib/shop-products-listing-api-params';

describe('buildShopListingApiParams', () => {
  it('includes lean PLP flags and default limit', () => {
    const params = buildShopListingApiParams('category=phones&page=2', 'hy');
    expect(params).toMatchObject({
      lang: 'hy',
      listingOmitProductAttributes: '1',
      plpLeanListing: '1',
      listingImageLimit: '1',
      compact: '1',
      includeFilters: '0',
      skipExactTotalCount: '1',
      category: 'phones',
      page: '2',
      limit: '12',
    });
  });

  it('can opt out of approximate totals when exact pagination is required', () => {
    const params = buildShopListingApiParams('page=2', 'en', {
      skipExactTotalCount: false,
    });

    expect(params.skipExactTotalCount).toBeUndefined();
  });
});

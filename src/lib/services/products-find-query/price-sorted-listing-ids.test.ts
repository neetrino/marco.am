import { describe, expect, it } from 'vitest';
import {
  isPriceListingSortKey,
  resolvePriceListingSortDirection,
  usesPriceDbSortPath,
} from '@/lib/services/products-find-query/price-sorted-listing-ids';

describe('price-sorted-listing-ids policy', () => {
  it('detects price sort keys', () => {
    expect(isPriceListingSortKey('price-asc')).toBe(true);
    expect(isPriceListingSortKey('price')).toBe(true);
    expect(isPriceListingSortKey('popular')).toBe(false);
  });

  it('maps legacy price key to descending', () => {
    expect(resolvePriceListingSortDirection('price')).toBe('price-desc');
    expect(resolvePriceListingSortDirection('price-asc')).toBe('price-asc');
  });

  it('enables DB price path for lean PLP without spec filters', () => {
    expect(
      usesPriceDbSortPath({
        sort: 'price-asc',
        plpLeanListing: true,
        listingOmitProductAttributes: true,
      }),
    ).toBe(true);
  });

  it('disables DB price path when technical specs are active', () => {
    expect(
      usesPriceDbSortPath({
        sort: 'price-desc',
        plpLeanListing: true,
        listingOmitProductAttributes: true,
        technicalSpecs: { ram: ['8gb'] },
      }),
    ).toBe(false);
  });
});

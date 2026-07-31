import { describe, expect, it } from 'vitest';

import {
  isValidProductSlug,
  normalizePdpSlug,
  productPdpHref,
} from '@/lib/product-pdp/pdp-slug';

describe('normalizePdpSlug', () => {
  it('strips variant suffix', () => {
    expect(normalizePdpSlug('my-product:variant-1')).toBe('my-product');
  });

  it('decodes encoded slug segments', () => {
    expect(normalizePdpSlug(encodeURIComponent('my product'))).toBe('my product');
  });
});

describe('isValidProductSlug', () => {
  it('rejects empty and literal null/undefined', () => {
    expect(isValidProductSlug('')).toBe(false);
    expect(isValidProductSlug('   ')).toBe(false);
    expect(isValidProductSlug('null')).toBe(false);
    expect(isValidProductSlug('NULL')).toBe(false);
    expect(isValidProductSlug('undefined')).toBe(false);
    expect(isValidProductSlug(null)).toBe(false);
    expect(isValidProductSlug(undefined)).toBe(false);
  });

  it('accepts normal slugs', () => {
    expect(isValidProductSlug('my-product')).toBe(true);
  });
});

describe('productPdpHref', () => {
  it('builds storefront path', () => {
    expect(productPdpHref('my-product')).toBe('/products/my-product');
  });
});

import { describe, expect, it } from 'vitest';

import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';

describe('normalizePdpSlug', () => {
  it('strips variant suffix', () => {
    expect(normalizePdpSlug('my-product:variant-1')).toBe('my-product');
  });

  it('decodes encoded slug segments', () => {
    expect(normalizePdpSlug(encodeURIComponent('my product'))).toBe('my product');
  });
});

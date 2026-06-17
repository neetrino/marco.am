import { describe, expect, it } from 'vitest';

import {
  buildBrandLogoR2Key,
  resolveBrandLogoR2Basename,
} from '@/lib/services/admin/brand-logo-storage';

describe('resolveBrandLogoR2Basename', () => {
  it('uses canonical slug when not import-prefixed', () => {
    expect(resolveBrandLogoR2Basename({ slug: 'galanz', name: 'Galanz' })).toBe('galanz');
  });

  it('falls back to name slug for import slugs', () => {
    expect(
      resolveBrandLogoR2Basename({
        slug: 'import-krk17ecuzvm',
        name: 'Galanz',
      }),
    ).toBe('galanz');
  });

  it('falls back to brand id when name is empty', () => {
    expect(
      resolveBrandLogoR2Basename({
        slug: 'import-abc',
        name: '   ',
        brandId: 'brand_123',
      }),
    ).toBe('brand_123');
  });
});

describe('buildBrandLogoR2Key', () => {
  it('builds key under brands/logos prefix', () => {
    expect(buildBrandLogoR2Key('galanz', 'webp')).toBe('brands/logos/galanz.webp');
  });
});

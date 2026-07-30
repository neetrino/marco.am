import { describe, expect, it } from 'vitest';

import {
  appendBrandLogoCacheBuster,
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

  it('falls back to hashed name when slug and ascii slug are unavailable', () => {
    const basename = resolveBrandLogoR2Basename({
      name: 'Գալանզ',
    });
    expect(basename.startsWith('name-')).toBe(true);
    expect(basename.length).toBe('name-'.length + 24);
    expect(
      resolveBrandLogoR2Basename({
        name: 'Գալանզ',
      }),
    ).toBe(basename);
  });
});

describe('buildBrandLogoR2Key', () => {
  it('builds key under brands/logos prefix', () => {
    expect(buildBrandLogoR2Key('galanz', 'webp')).toBe('brands/logos/galanz.webp');
  });
});

describe('appendBrandLogoCacheBuster', () => {
  it('appends a stable content hash query param', () => {
    const buffer = Buffer.from('logo-bytes');
    const url = appendBrandLogoCacheBuster(
      'https://cdn.example.com/brands/logos/galanz.webp',
      buffer,
    );
    expect(url).toMatch(/^https:\/\/cdn\.example\.com\/brands\/logos\/galanz\.webp\?v=[a-f0-9]{16}$/);
    expect(appendBrandLogoCacheBuster(url, buffer)).toBe(url);
  });
});

import { describe, expect, it } from 'vitest';
import { resolveAdminProductListImageUrl } from './admin-list-product-image';

describe('resolveAdminProductListImageUrl', () => {
  it('returns processed R2 URL from media', () => {
    const url = 'https://pub-abc.r2.dev/products/hero.webp';
    expect(resolveAdminProductListImageUrl([url])).toBe(url);
  });

  it('falls back to variant image when media is empty', () => {
    const url = 'https://pub-abc.r2.dev/products/variant.webp';
    expect(
      resolveAdminProductListImageUrl([], [{ imageUrl: url }]),
    ).toBe(url);
  });

  it('never returns embedded base64 for list thumbnails', () => {
    const dataUrl = 'data:image/webp;base64,AAAA';
    expect(resolveAdminProductListImageUrl([dataUrl])).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  canRenderAdminProductListImage,
  normalizeAdminListImageUrl,
  resolveAdminProductListImageUrl,
} from './admin-list-product-image';

describe('normalizeAdminListImageUrl', () => {
  it('preserves valid Cloudflare R2 HTTPS URLs', () => {
    const url = 'https://pub-abc.r2.dev/products/hero.webp';
    expect(normalizeAdminListImageUrl(url)).toBe(url);
  });

  it('preserves valid site-relative paths', () => {
    expect(normalizeAdminListImageUrl('/uploads/products/a.webp')).toBe('/uploads/products/a.webp');
    expect(normalizeAdminListImageUrl('/assets/hero.jpg')).toBe('/assets/hero.jpg');
  });

  it('rejects empty strings', () => {
    expect(normalizeAdminListImageUrl('')).toBeNull();
    expect(normalizeAdminListImageUrl('   ')).toBeNull();
  });

  it('rejects data: URLs', () => {
    expect(normalizeAdminListImageUrl('data:image/webp;base64,AAAA')).toBeNull();
  });

  it('rejects raw base64 content', () => {
    const raw = 'A'.repeat(120);
    expect(normalizeAdminListImageUrl(raw)).toBeNull();
  });

  it('rejects blob: URLs', () => {
    expect(normalizeAdminListImageUrl('blob:https://example.com/uuid')).toBeNull();
  });

  it('rejects malformed URLs', () => {
    expect(normalizeAdminListImageUrl('https://')).toBeNull();
    expect(normalizeAdminListImageUrl('not a url')).toBeNull();
  });
});

describe('resolveAdminProductListImageUrl', () => {
  const r2Primary = 'https://pub-abc.r2.dev/products/primary.webp';
  const r2Secondary = 'https://pub-abc.r2.dev/products/secondary.webp';
  const r2Variant = 'https://pub-abc.r2.dev/products/variant.webp';
  const r2OtherVariant = 'https://pub-abc.r2.dev/products/other-variant.webp';
  const r2Listing = 'https://pub-abc.r2.dev/products/listing.webp';

  it('returns primary product media image when present', () => {
    expect(resolveAdminProductListImageUrl([r2Primary, r2Secondary])).toBe(r2Primary);
  });

  it('returns first valid media when primary is data:/invalid', () => {
    expect(
      resolveAdminProductListImageUrl(['data:image/webp;base64,AAAA', r2Secondary]),
    ).toBe(r2Secondary);
  });

  it('falls back to published variant imageUrl when media is empty', () => {
    expect(
      resolveAdminProductListImageUrl([], [{ imageUrl: r2Variant, price: 10, published: true }]),
    ).toBe(r2Variant);
  });

  it('uses any published variant when primary variant has no valid image', () => {
    expect(
      resolveAdminProductListImageUrl(
        [],
        [
          { imageUrl: 'data:image/webp;base64,AAAA', price: 5, published: true },
          { imageUrl: r2OtherVariant, price: 20, published: true },
        ],
      ),
    ).toBe(r2OtherVariant);
  });

  it('falls back to ProductListingRow.image when media and variants lack valid URLs', () => {
    expect(
      resolveAdminProductListImageUrl(
        ['data:image/webp;base64,AAAA'],
        [{ imageUrl: null, price: 10, published: true }],
        r2Listing,
      ),
    ).toBe(r2Listing);
  });

  it('rejects data: URL at every source and returns null', () => {
    expect(
      resolveAdminProductListImageUrl(
        ['data:image/webp;base64,AAAA'],
        [{ imageUrl: 'data:image/png;base64,BBBB', price: 1, published: true }],
        'data:image/jpeg;base64,CCCC',
      ),
    ).toBeNull();
  });

  it('rejects raw base64', () => {
    const raw = 'B'.repeat(100);
    expect(resolveAdminProductListImageUrl([raw])).toBeNull();
  });

  it('preserves valid R2 URL from media', () => {
    expect(resolveAdminProductListImageUrl([r2Primary])).toBe(r2Primary);
  });

  it('preserves valid site-relative path from media', () => {
    expect(resolveAdminProductListImageUrl(['/assets/p.jpg'])).toBe('/assets/p.jpg');
  });

  it('returns null when all sources are missing', () => {
    expect(resolveAdminProductListImageUrl([], [], null)).toBeNull();
    expect(resolveAdminProductListImageUrl(undefined, [], null)).toBeNull();
  });
});

describe('canRenderAdminProductListImage', () => {
  it('renders when API image contains a valid URL', () => {
    expect(canRenderAdminProductListImage('https://pub-abc.r2.dev/products/a.webp')).toBe(true);
    expect(canRenderAdminProductListImage('/uploads/a.webp')).toBe(true);
  });

  it('does not render when API image is null or rejected', () => {
    expect(canRenderAdminProductListImage(null)).toBe(false);
    expect(canRenderAdminProductListImage('data:image/webp;base64,AAAA')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import {
  buildProductGalleryUrls,
  resolveListingHeroImageUrl,
} from '@/lib/products/product-gallery-urls';

describe('product-gallery-urls', () => {
  it('excludes variant-only URLs and keeps canonical media order', () => {
    const media = [
      'https://marco.am/wp-content/uploads/2025/02/1.png',
      'https://marco.am/wp-content/uploads/2025/02/2.png',
      'https://marco.am/wp-content/uploads/2025/02/3.png',
    ];
    const variants = [{ imageUrl: 'https://marco.am/wp-content/uploads/2025/02/1.png' }];

    expect(buildProductGalleryUrls(media, variants)).toEqual([
      'https://marco.am/wp-content/uploads/2025/02/2.png',
      'https://marco.am/wp-content/uploads/2025/02/3.png',
    ]);
    expect(resolveListingHeroImageUrl(media, variants)).toBe(
      'https://marco.am/wp-content/uploads/2025/02/2.png',
    );
  });

  it('dedupes repeated media URLs', () => {
    const media = ['https://example.com/a.jpg', 'https://example.com/a.jpg', 'https://example.com/b.jpg'];

    expect(buildProductGalleryUrls(media)).toEqual([
      'https://example.com/a.jpg',
      'https://example.com/b.jpg',
    ]);
  });

  it('prepends variant image when media has only one usable photo', () => {
    const media = ['https://example.com/23429-2.jpg'];
    const variants = [{ imageUrl: 'https://example.com/23429-1.jpg' }];

    expect(buildProductGalleryUrls(media, variants)).toEqual([
      'https://example.com/23429-1.jpg',
      'https://example.com/23429-2.jpg',
    ]);
    expect(resolveListingHeroImageUrl(media, variants)).toBe('https://example.com/23429-1.jpg');
  });
});

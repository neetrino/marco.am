import { describe, expect, it } from 'vitest';
import {
  PRODUCT_IMAGE_MUST_BE_R2_MESSAGE,
  assertPersistedProductImageUrl,
  assertPersistedProductMediaPayload,
  classifyInvalidPersistedProductImage,
  toPersistedProductImageUrl,
} from './persisted-product-image-url';
import { processImagesForSubmit } from '@/app/supersudo/products/add/hooks/useImageProcessingForSubmit';

describe('persisted product image URL', () => {
  it('accepts HTTPS R2 URLs', () => {
    const url = 'https://pub-abc.r2.dev/products/a.webp';
    expect(assertPersistedProductImageUrl(url)).toBe(url);
    expect(classifyInvalidPersistedProductImage(url)).toBeNull();
  });

  it('accepts site-relative paths', () => {
    expect(assertPersistedProductImageUrl('/assets/p.webp')).toBe('/assets/p.webp');
  });

  it('rejects data: URLs', () => {
    expect(classifyInvalidPersistedProductImage('data:image/webp;base64,AAAA')).toBe('data_url');
    expect(() => assertPersistedProductImageUrl('data:image/webp;base64,AAAA')).toThrow(
      PRODUCT_IMAGE_MUST_BE_R2_MESSAGE,
    );
  });

  it('rejects raw base64', () => {
    expect(classifyInvalidPersistedProductImage('A'.repeat(120))).toBe('raw_base64');
  });

  it('rejects blob URLs', () => {
    expect(classifyInvalidPersistedProductImage('blob:https://x/y')).toBe('blob_url');
  });

  it('rejects malformed URLs', () => {
    expect(classifyInvalidPersistedProductImage('https://')).toBe('malformed');
  });

  it('validates media payload arrays', () => {
    expect(
      assertPersistedProductMediaPayload([
        'https://pub-abc.r2.dev/products/a.webp',
        { url: 'https://pub-abc.r2.dev/products/b.webp' },
      ]),
    ).toEqual([
      'https://pub-abc.r2.dev/products/a.webp',
      'https://pub-abc.r2.dev/products/b.webp',
    ]);
  });

  it('soft helper returns null for data URLs', () => {
    expect(toPersistedProductImageUrl('data:image/webp;base64,AAAA')).toBeNull();
  });
});

describe('processImagesForSubmit', () => {
  it('keeps HTTPS media and main image', () => {
    const url = 'https://pub-abc.r2.dev/products/a.webp';
    const result = processImagesForSubmit({
      imageUrls: [url],
      featuredImageIndex: 0,
      mainProductImage: url,
      variants: [],
    });
    expect(result.finalMedia).toEqual([url]);
    expect(result.mainImage).toBe(url);
  });

  it('rejects data: images instead of persisting them', () => {
    expect(() =>
      processImagesForSubmit({
        imageUrls: ['data:image/webp;base64,AAAA'],
        featuredImageIndex: 0,
        mainProductImage: '',
        variants: [],
      }),
    ).toThrow(PRODUCT_IMAGE_MUST_BE_R2_MESSAGE);
  });
});

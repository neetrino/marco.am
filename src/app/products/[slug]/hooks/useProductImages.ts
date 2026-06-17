import { useMemo } from 'react';

import { buildProductGalleryUrls } from '@/lib/products/product-gallery-urls';

import type { Product } from '../types';

/** Canonical gallery URLs — matches PDP API / PLP listing order. */
export function useProductImages(product: Product | null): string[] {
  return useMemo(() => {
    if (!product) {
      return [];
    }
    return buildProductGalleryUrls(product.media, product.variants ?? []);
  }, [product]);
}

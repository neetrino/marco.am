import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';
import { isPdpListingShell } from '@/lib/product-pdp/resolve-pdp-listing-shell';

import type { Product, ProductLabel } from './types';

function filterMediaUrls(media: unknown): string[] {
  if (!Array.isArray(media)) {
    return [];
  }
  return media.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

/**
 * While PDP detail is still streaming, prefer `/visual` gallery URLs over the single PLP hero
 * so thumbnails match the main image before variant media arrives.
 */
export function enrichListingShellGallery(
  product: Product,
  visual: PdpVisualPayload | null,
): Product {
  if (!visual || !isPdpListingShell(product)) {
    return product;
  }

  if (visual.id !== product.id && visual.slug !== product.slug) {
    return product;
  }

  const shellMedia = filterMediaUrls(product.media);
  const visualMedia = filterMediaUrls(visual.images);
  const hero = shellMedia[0] ?? visualMedia[0] ?? null;

  if (!hero) {
    return product;
  }

  const mergedMedia =
    visualMedia.length > shellMedia.length
      ? visualMedia
      : shellMedia.length > 0
        ? shellMedia
        : [hero];

  const labels =
    product.labels && product.labels.length > 0
      ? product.labels
      : (visual.labels as ProductLabel[] | undefined);

  if (
    mergedMedia.length === shellMedia.length &&
    mergedMedia.every((url, index) => url === shellMedia[index]) &&
    labels === product.labels
  ) {
    return product;
  }

  return {
    ...product,
    media: mergedMedia,
    labels: labels ?? product.labels,
  };
}

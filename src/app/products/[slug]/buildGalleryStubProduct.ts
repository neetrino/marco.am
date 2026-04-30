import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';
import type { Product, ProductLabel } from './types';

/**
 * Minimal `Product` for gallery + labels until full PDP payload arrives.
 */
export function buildGalleryStubProduct(visual: PdpVisualPayload): Product {
  return {
    id: visual.id,
    slug: visual.slug,
    title: visual.title,
    media: visual.images,
    variants: [],
    labels: visual.labels as ProductLabel[],
  };
}

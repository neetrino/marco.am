import type { Product, ProductVariant } from '../products/[slug]/types';
import { processImageUrl } from '../../lib/utils/image-utils';

export function normalizeProductSlug(slug: string | undefined): string | undefined {
  const trimmed = slug?.trim();
  return trimmed || undefined;
}

export function resolveGuestCartItemImage(
  product: Product,
  variant: ProductVariant,
): string | null {
  if (variant.imageUrl) {
    return processImageUrl(variant.imageUrl);
  }

  const mediaFirst = product.media?.[0];
  if (typeof mediaFirst === 'string') {
    return processImageUrl(mediaFirst);
  }
  if (mediaFirst && typeof mediaFirst === 'object' && 'url' in mediaFirst) {
    return processImageUrl(mediaFirst.url);
  }

  return null;
}

export function findGuestCartVariant(
  product: Product,
  variantId: string,
): ProductVariant | undefined {
  return (
    product.variants.find((variant) => variant.id === variantId) ?? product.variants[0]
  );
}

export function resolveGuestCartItemTitle(
  product: Product,
  storedTitle: string | undefined,
  fallback: string,
): string {
  const apiTitle = product.title?.trim();
  if (apiTitle) {
    return apiTitle;
  }
  const cachedTitle = storedTitle?.trim();
  if (cachedTitle) {
    return cachedTitle;
  }
  return fallback;
}

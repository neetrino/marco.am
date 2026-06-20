import { resolveListingHeroImageUrl } from '@/lib/products/product-gallery-urls';
import { processImageUrl } from '@/lib/utils/image-utils';

type ListVariantImageSource = {
  imageUrl?: string | null;
};

/**
 * Hero image for admin products table — URL only (no embedded base64 in list payloads).
 */
export function resolveAdminProductListImageUrl(
  media: unknown,
  variants: readonly ListVariantImageSource[] = [],
): string | null {
  const raw = resolveListingHeroImageUrl(media, variants);
  const processed = processImageUrl(raw);
  if (!processed) {
    return null;
  }
  if (processed.startsWith('data:')) {
    return null;
  }
  return processed;
}

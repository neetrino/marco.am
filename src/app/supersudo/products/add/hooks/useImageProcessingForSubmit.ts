import {
  PRODUCT_IMAGE_MUST_BE_R2_MESSAGE,
  assertPersistedProductImageUrl,
  isDataOrBlobImageReference,
} from '@/lib/products/persisted-product-image-url';

/** Variant-like objects that may carry comma-separated image URLs for submit. */
type VariantImageCarrier = { imageUrl?: string };

interface ProcessImagesForSubmitProps {
  imageUrls: string[];
  featuredImageIndex: number;
  mainProductImage: string;
  variants: VariantImageCarrier[];
}

function assertSubmitImageUrl(url: string): string {
  if (isDataOrBlobImageReference(url)) {
    throw new Error(PRODUCT_IMAGE_MUST_BE_R2_MESSAGE);
  }
  return assertPersistedProductImageUrl(url);
}

export function processImagesForSubmit({
  imageUrls,
  featuredImageIndex,
  mainProductImage,
  variants,
}: ProcessImagesForSubmitProps): {
  finalMedia: string[];
  mainImage: string | null;
  processedVariants: VariantImageCarrier[];
} {
  const processMainImageSlot = (url: string): string | null => {
    if (!url || !url.trim()) {
      return null;
    }
    return assertSubmitImageUrl(url.trim());
  };

  const mainImageMapping: (string | null)[] = imageUrls.map((url) => processMainImageSlot(url));

  const processedVariants = variants.map((variant) => {
    if (!variant.imageUrl) {
      return { ...variant };
    }
    const parts = variant.imageUrl
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => assertSubmitImageUrl(part));
    return { ...variant, imageUrl: parts.join(',') };
  });

  const finalMedia: string[] = [];

  if (imageUrls.length > 0) {
    if (mainImageMapping[featuredImageIndex]) {
      finalMedia.push(mainImageMapping[featuredImageIndex]!);
    }
    mainImageMapping.forEach((url, index) => {
      if (index !== featuredImageIndex && url) {
        finalMedia.push(url);
      }
    });
  } else if (mainProductImage) {
    const slot = processMainImageSlot(mainProductImage);
    if (slot) {
      finalMedia.push(slot);
    }
  }

  const mainImage: string | null = (() => {
    if (imageUrls.length > 0) {
      const atFeatured = mainImageMapping[featuredImageIndex] ?? null;
      if (atFeatured) {
        return atFeatured;
      }
      return mainImageMapping.find((u) => u) ?? null;
    }
    if (mainProductImage) {
      return processMainImageSlot(mainProductImage);
    }
    return null;
  })();

  return { finalMedia, mainImage, processedVariants };
}

/** Variant-like objects that may carry comma-separated image URLs for submit. */
export type VariantImageCarrier = { imageUrl?: string };

interface ProcessImagesForSubmitProps {
  imageUrls: string[];
  featuredImageIndex: number;
  mainProductImage: string;
  variants: VariantImageCarrier[];
}

const MAX_BASE64_SIZE = 5 * 1024 * 1024;

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
  const isBase64Image = (url: string): boolean => {
    return url.startsWith('data:image/');
  };

  const isUrl = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const getBase64Size = (base64: string): number => {
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    return Math.ceil(base64Data.length * 0.75);
  };

  const processImages = (images: string[]): { processed: string[]; skipped: number } => {
    let skippedCount = 0;

    const processed = images.filter((img) => {
      if (isUrl(img)) {
        return true;
      }

      if (isBase64Image(img)) {
        const size = getBase64Size(img);
        if (size > MAX_BASE64_SIZE) {
          console.warn(`⚠️ [ADMIN] Image too large (${Math.round(size / 1024)}KB), skipping to avoid 413 error.`);
          skippedCount++;
          return false;
        }
        return true;
      }

      return true;
    });

    return { processed, skipped: skippedCount };
  };

  /** One slot in `imageUrls` → processed URL or null; indices match `imageUrls` exactly (no `filter` / `indexOf` bugs). */
  const processMainImageSlot = (url: string): { slot: string | null; skipped: number } => {
    if (!url || !url.trim()) {
      return { slot: null, skipped: 0 };
    }
    if (isUrl(url)) {
      return { slot: url, skipped: 0 };
    }
    if (isBase64Image(url)) {
      const size = getBase64Size(url);
      if (size > MAX_BASE64_SIZE) {
        console.warn(
          `⚠️ [ADMIN] Main image too large (${Math.round(size / 1024)}KB), skipping to avoid 413 error.`
        );
        return { slot: null, skipped: 1 };
      }
      return { slot: url, skipped: 0 };
    }
    return { slot: url, skipped: 0 };
  };

  let mainSkipped = 0;
  const mainImageMapping: (string | null)[] = imageUrls.map((url) => {
    const { slot, skipped } = processMainImageSlot(url);
    mainSkipped += skipped;
    return slot;
  });

  const variantImages: string[] = [];
  variants.forEach((variant) => {
    if (variant.imageUrl) {
      const parts = variant.imageUrl
        .split(',')
        .map((p: string) => p.trim())
        .filter(Boolean);
      variantImages.push(...parts);
    }
  });

  const variantImagesProcessed = variantImages.length > 0 ? processImages(variantImages) : { processed: [], skipped: 0 };
  const processedVariantImages = variantImagesProcessed.processed;
  const skippedImagesCount = mainSkipped + variantImagesProcessed.skipped;

  if (skippedImagesCount > 0) {
    console.warn(`⚠️ [ADMIN] ${skippedImagesCount} large image(s) were skipped to avoid 413 error.`);
  }

  const processedVariants = [...variants];
  let variantImageIndex = 0;
  processedVariants.forEach((variant) => {
    if (variant.imageUrl) {
      const parts = variant.imageUrl
        .split(',')
        .map((p: string) => p.trim())
        .filter(Boolean);
      const processedUrls = processedVariantImages.slice(
        variantImageIndex,
        variantImageIndex + parts.length
      );
      variant.imageUrl = processedUrls.join(',');
      variantImageIndex += parts.length;
    }
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
    const { slot } = processMainImageSlot(mainProductImage);
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
      const first = mainImageMapping.find((u) => u) ?? null;
      return first;
    }
    if (mainProductImage) {
      const { slot } = processMainImageSlot(mainProductImage);
      return slot;
    }
    return null;
  })();

  return { finalMedia, mainImage, processedVariants };
}

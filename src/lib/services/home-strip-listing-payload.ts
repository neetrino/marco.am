/** Max gallery URLs embedded per home card (slider rarely needs more on `/`). */
export const HOME_STRIP_MAX_GALLERY_IMAGES = 4;

/** Max color swatches serialized per home card. */
export const HOME_STRIP_MAX_COLOR_SWATCHES = 6;

type HomeStripColor = {
  value: string;
  imageUrl?: string | null;
  colors?: string[] | null;
};

export type HomeStripListingProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  image: string | null;
  images?: string[];
  inStock: boolean;
  brand: unknown;
  defaultVariantId?: string | null;
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
  labels?: unknown[];
  warrantyYears?: number | null;
  warrantyBadge?: { years: number } | null;
  colors?: HomeStripColor[];
  requiresAttributeSelection?: boolean | null;
};

function trimGalleryImages(images: string[] | undefined): string[] | undefined {
  if (!images?.length) {
    return images;
  }
  return images.slice(0, HOME_STRIP_MAX_GALLERY_IMAGES);
}

function trimColors(colors: HomeStripColor[] | undefined): HomeStripColor[] | undefined {
  if (!colors?.length) {
    return colors;
  }
  return colors.slice(0, HOME_STRIP_MAX_COLOR_SWATCHES).map((entry) => ({
    value: entry.value,
    ...(entry.imageUrl ? { imageUrl: entry.imageUrl } : {}),
  }));
}

/**
 * Shrinks listing rows cached/rendered on home strips (smaller RSC payload, faster hydration).
 */
export function trimProductsForHomeStripListing(
  rows: HomeStripListingProduct[],
): HomeStripListingProduct[] {
  return rows.map((row) => {
    const trimmed: HomeStripListingProduct = {
      ...row,
      images: trimGalleryImages(row.images),
      colors: trimColors(row.colors),
    };
    if (trimmed.originalPrice != null && trimmed.originalPrice > 0) {
      delete trimmed.compareAtPrice;
    }
    if (trimmed.warrantyBadge != null) {
      delete trimmed.warrantyYears;
    }
    return trimmed;
  });
}

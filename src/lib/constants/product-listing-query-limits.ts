/**
 * Max published variants loaded per product in standard PLP listing queries.
 * Transform scans at most this many variants for color swatches and listing price.
 */
export const PRODUCT_LISTING_VARIANTS_PER_PRODUCT_LIMIT = 10;

/** Variants per product in lean PLP query (no attributeValue joins). */
export const PLP_LEAN_VARIANTS_PER_PRODUCT_LIMIT = 3;

import type { Variant, GeneratedVariant } from '../types';
import type { ProductDescriptionEntry } from '@/lib/products/product-description';

/**
 * Editor sections heavy enough to skip on the backend when unchanged.
 * Omitting these from the update payload triggers the backend fast path
 * (`data.media === undefined` / `data.variants === undefined`), avoiding
 * base64 re-transfer and full variant rewrites for unrelated edits.
 */
export const GATED_SECTIONS = ['media', 'description', 'pricing'] as const;
export type GatedSection = (typeof GATED_SECTIONS)[number];

export type SectionFingerprints = Partial<Record<GatedSection, string>>;

export interface DirtyFingerprintInput {
  imageUrls: string[];
  featuredImageIndex: number;
  mainProductImage: string;
  subtitleHtml: string;
  description: ProductDescriptionEntry[];
  productType: 'simple' | 'variable';
  simpleProductData: {
    price: string;
    compareAtPrice: string;
    sku: string;
    quantity: string;
    variantId: string;
  };
  variants: Variant[];
  generatedVariants: GeneratedVariant[];
  selectedAttributeIds: string[];
}

/** Serializes the save-relevant slice of each gated section into a comparable string. */
export function computeGatedFingerprints(
  input: DirtyFingerprintInput,
): Record<GatedSection, string> {
  return {
    media: JSON.stringify({
      imageUrls: input.imageUrls,
      featuredImageIndex: input.featuredImageIndex,
      mainProductImage: input.mainProductImage,
    }),
    description: JSON.stringify({
      subtitleHtml: input.subtitleHtml,
      description: input.description,
    }),
    pricing: JSON.stringify({
      productType: input.productType,
      simpleProductData: input.simpleProductData,
      variants: input.variants,
      generatedVariants: input.generatedVariants,
      attributeIds: [...input.selectedAttributeIds].sort(),
    }),
  };
}

/**
 * Sections the user actually changed. A missing baseline is treated as dirty,
 * so we never drop data when the baseline was not captured yet.
 */
export function resolveDirtySections(
  current: Record<GatedSection, string>,
  baseline: SectionFingerprints,
): Record<GatedSection, boolean> {
  const dirty = {} as Record<GatedSection, boolean>;
  for (const section of GATED_SECTIONS) {
    dirty[section] = baseline[section] === undefined || baseline[section] !== current[section];
  }
  return dirty;
}

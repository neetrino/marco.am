/**
 * Admin/API variant shape stored on `window.__productVariantsToConvert` before client-side conversion.
 */
export type ProductVariantForConversion = {
  id?: string;
  sku?: string;
  price?: unknown;
  stock?: unknown;
  imageUrl?: string | null;
  attributes?: Record<string, unknown>;
  options?: unknown[];
  [key: string]: unknown;
};

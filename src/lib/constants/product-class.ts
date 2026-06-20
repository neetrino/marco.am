export const PRODUCT_CLASSES = ["retail", "wholesale"] as const;

export type ProductClass = (typeof PRODUCT_CLASSES)[number];

const DEFAULT_PRODUCT_CLASS: ProductClass = "retail";

export function normalizeProductClass(value: unknown): ProductClass | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return PRODUCT_CLASSES.find((productClass) => productClass === normalized) ?? null;
}

export function resolveProductClass(value: unknown): ProductClass {
  return normalizeProductClass(value) ?? DEFAULT_PRODUCT_CLASS;
}

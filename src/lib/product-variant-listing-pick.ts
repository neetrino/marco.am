function variantPriceNumber(v: { price: number }): number {
  const n = typeof v.price === "number" ? v.price : Number(v.price);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Pick the variant used for catalog list price, card default variant, and PDP default order.
 * Prefers published variants; when any variant has a positive price, ignores zero-priced variants
 * so placeholder / duplicate SKUs do not collapse the displayed price to 0.
 */
export function pickVariantForListingPrice<T extends { price: number; published?: boolean }>(
  variants: T[] | null | undefined
): T | null {
  const list = Array.isArray(variants) ? variants : [];
  if (list.length === 0) {
    return null;
  }
  const published = list.filter((v) => v.published !== false);
  const pool = published.length > 0 ? published : list;
  const positive = pool.filter((v) => variantPriceNumber(v) > 0);
  const candidates = positive.length > 0 ? positive : pool;
  const sorted = [...candidates].sort((a, b) => variantPriceNumber(a) - variantPriceNumber(b));
  return sorted[0] ?? null;
}

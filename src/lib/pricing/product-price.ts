export interface ResolvedProductPrice {
  currentPrice: number;
  oldPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
}

interface ResolveProductPriceInput {
  currentPrice: number;
  compareAtPrice?: number | null;
  fallbackDiscountPercent?: number | null;
}

function sanitizePrice(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function computeDiscountPercent(currentPrice: number, oldPrice: number | null): number | null {
  if (!oldPrice || oldPrice <= 0 || oldPrice <= currentPrice) {
    return null;
  }
  const rawPercent = ((oldPrice - currentPrice) / oldPrice) * 100;
  const roundedPercent = Math.round(rawPercent);
  return roundedPercent > 0 ? roundedPercent : null;
}

function computeOldPriceFromDiscount(
  currentPrice: number,
  fallbackDiscountPercent: number | null,
): number | null {
  if (!fallbackDiscountPercent || fallbackDiscountPercent <= 0 || currentPrice <= 0) {
    return null;
  }
  return currentPrice / (1 - fallbackDiscountPercent / 100);
}

/**
 * Canonical pricing resolver for storefront product payloads.
 * Ensures "current price" is always the selling price and "old price" is only shown as a strike-through when valid.
 */
export function resolveProductPrice(input: ResolveProductPriceInput): ResolvedProductPrice {
  const currentPrice = sanitizePrice(input.currentPrice) ?? 0;
  const compareAtPrice = sanitizePrice(input.compareAtPrice);
  const fallbackDiscountPercent = sanitizePrice(input.fallbackDiscountPercent);
  const hasCompareAt = compareAtPrice !== null && compareAtPrice > currentPrice;
  const oldPrice = hasCompareAt
    ? compareAtPrice
    : computeOldPriceFromDiscount(currentPrice, fallbackDiscountPercent);
  const discountFromPrices = computeDiscountPercent(currentPrice, oldPrice);
  const discountPercent = hasCompareAt
    ? discountFromPrices
    : fallbackDiscountPercent && fallbackDiscountPercent > 0
      ? fallbackDiscountPercent
      : discountFromPrices;

  return {
    currentPrice,
    oldPrice,
    compareAtPrice: hasCompareAt ? compareAtPrice : null,
    discountPercent,
  };
}

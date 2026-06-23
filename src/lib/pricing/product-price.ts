import { NO_DISCOUNT, type AppliedDiscount } from '@/lib/discount/discount-expiry';

interface ResolvedProductPrice {
  /** Final selling price (what the customer pays). */
  currentPrice: number;
  /** Standard price shown struck-through when a discount applies; null otherwise. */
  oldPrice: number | null;
  /** Alias of `oldPrice`, kept for read-model/storefront output compatibility. */
  compareAtPrice: number | null;
  /** Effective discount percentage for badges and sorting. */
  discountPercent: number | null;
  /** Legacy «special price» flag — always false in the unified model. */
  isSpecialPrice: boolean;
}

interface ResolveProductPriceInput {
  /** Standard (base) price — the source of truth. */
  standardPrice: number;
  /** Already-resolved active discount (precedence + expiry applied by the caller). */
  discount?: AppliedDiscount | null;
}

function sanitizePrice(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function computeDiscountPercent(currentPrice: number, standardPrice: number): number | null {
  if (standardPrice <= 0 || standardPrice <= currentPrice) {
    return null;
  }
  const roundedPercent = Math.round(((standardPrice - currentPrice) / standardPrice) * 100);
  return roundedPercent > 0 ? roundedPercent : null;
}

function computeFinalPrice(standardPrice: number, discount: AppliedDiscount): number {
  if (standardPrice <= 0) {
    return standardPrice;
  }
  if (discount.type === 'PERCENT' && discount.value > 0 && discount.value < 100) {
    return Math.round(standardPrice * (1 - discount.value / 100));
  }
  if (discount.type === 'AMOUNT' && discount.value > 0 && discount.value < standardPrice) {
    return discount.value;
  }
  return standardPrice;
}

/**
 * Canonical pricing resolver. `standardPrice` is the base; the final price is derived
 * from the resolved discount. Used by storefront, read-model, cart, and order paths so
 * the displayed and charged prices always match.
 */
export function resolveProductPrice(input: ResolveProductPriceInput): ResolvedProductPrice {
  const standardPrice = sanitizePrice(input.standardPrice) ?? 0;
  const discount = input.discount ?? NO_DISCOUNT;
  const currentPrice = computeFinalPrice(standardPrice, discount);
  const discounted = currentPrice > 0 && currentPrice < standardPrice;
  const oldPrice = discounted ? standardPrice : null;

  return {
    currentPrice,
    oldPrice,
    compareAtPrice: oldPrice,
    discountPercent: discounted ? computeDiscountPercent(currentPrice, standardPrice) : null,
    isSpecialPrice: false,
  };
}

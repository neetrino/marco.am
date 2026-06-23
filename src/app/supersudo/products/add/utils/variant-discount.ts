import type { DiscountKind } from '@/lib/discount/discount-expiry';

/**
 * Per-variant discount as held in the editor form state. Structurally compatible
 * with `DiscountControlValue`, so it can be passed straight to `DiscountControl`.
 */
export interface VariantDiscount {
  type: DiscountKind;
  /** Percent (PERCENT) or final sale price in the default currency (AMOUNT). */
  value: number | null;
  expiresAt: string | null;
}

export const EMPTY_VARIANT_DISCOUNT: VariantDiscount = {
  type: 'NONE',
  value: null,
  expiresAt: null,
};

/** Discount fields exchanged with the admin product API (AMOUNT in catalog currency). */
export interface ApiVariantDiscount {
  discountType: DiscountKind;
  discountValue: number | null;
  discountExpiresAt: string | null;
}

function isActiveDiscount(discount: VariantDiscount): boolean {
  return discount.type !== 'NONE' && discount.value !== null && discount.value > 0;
}

/** Maps editor discount → API payload, converting an AMOUNT (sale price) to catalog currency. */
export function toApiVariantDiscount(
  discount: VariantDiscount,
  convertAmountToCatalog: (value: number) => number,
): ApiVariantDiscount {
  if (!isActiveDiscount(discount) || discount.value === null) {
    return { discountType: 'NONE', discountValue: null, discountExpiresAt: null };
  }
  const value =
    discount.type === 'AMOUNT' ? convertAmountToCatalog(discount.value) : discount.value;
  return {
    discountType: discount.type,
    discountValue: value,
    discountExpiresAt: discount.expiresAt,
  };
}

/** Maps a raw/API variant discount → editor state, converting an AMOUNT back to the default currency. */
export function fromApiVariantDiscount(
  raw: {
    discountType?: DiscountKind | string | null;
    discountValue?: number | null;
    discountExpiresAt?: string | Date | null;
  },
  convertAmountToDefault: (value: number) => number,
): VariantDiscount {
  const type = (raw.discountType ?? 'NONE') as DiscountKind;
  if (type === 'NONE' || raw.discountValue === null || raw.discountValue === undefined) {
    return { ...EMPTY_VARIANT_DISCOUNT };
  }
  const value =
    type === 'AMOUNT' ? convertAmountToDefault(raw.discountValue) : raw.discountValue;
  const expiresAt = raw.discountExpiresAt
    ? raw.discountExpiresAt instanceof Date
      ? raw.discountExpiresAt.toISOString()
      : raw.discountExpiresAt
    : null;
  return { type, value, expiresAt };
}

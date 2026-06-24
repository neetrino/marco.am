import type { DiscountKind } from "@/lib/discount/discount-expiry";

/** Prisma-ready per-variant discount fields. */
export interface VariantDiscountWrite {
  discountType: DiscountKind;
  discountValue: number | null;
  discountExpiresAt: Date | null;
}

const PERCENT_MAX = 100;

/**
 * Normalizes raw per-variant discount input (from the admin API) into Prisma-ready
 * fields. Non-positive/invalid values collapse to NONE; AMOUNT is the final sale
 * price in catalog currency, PERCENT is clamped to 0–100.
 */
export function normalizeVariantDiscountForWrite(input: {
  discountType?: DiscountKind | string | null;
  discountValue?: number | string | null;
  discountExpiresAt?: string | Date | null;
}): VariantDiscountWrite {
  const type = (input.discountType ?? "NONE") as DiscountKind;
  const rawValue =
    input.discountValue === null || input.discountValue === undefined || input.discountValue === ""
      ? null
      : Number(input.discountValue);
  const expiresAtDate = input.discountExpiresAt
    ? input.discountExpiresAt instanceof Date
      ? input.discountExpiresAt
      : new Date(input.discountExpiresAt)
    : null;
  const discountExpiresAt =
    expiresAtDate && !Number.isNaN(expiresAtDate.getTime()) ? expiresAtDate : null;

  if (type === "PERCENT" && rawValue !== null && Number.isFinite(rawValue) && rawValue > 0) {
    return {
      discountType: "PERCENT",
      discountValue: Math.min(PERCENT_MAX, rawValue),
      discountExpiresAt,
    };
  }
  if (type === "AMOUNT" && rawValue !== null && Number.isFinite(rawValue) && rawValue > 0) {
    return { discountType: "AMOUNT", discountValue: rawValue, discountExpiresAt };
  }
  return { discountType: "NONE", discountValue: null, discountExpiresAt: null };
}

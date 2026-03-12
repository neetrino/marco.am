import { db } from "@white-shop/db";

export type PromoValidationResult =
  | { valid: true; discountAmount: number; type: "percent" | "fixed"; value: number; code: string }
  | { valid: false; reason: string };

/**
 * Validate a promo code and compute discount for a given subtotal (in AMD).
 * Used at cart and checkout.
 */
export async function validatePromoCode(
  code: string,
  subtotal: number
): Promise<PromoValidationResult> {
  if (!code || typeof code !== "string" || !code.trim()) {
    return { valid: false, reason: "Code is required" };
  }

  const promo = await db.promoCode.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!promo) {
    return { valid: false, reason: "Promo code not found" };
  }

  if (!promo.active) {
    return { valid: false, reason: "Promo code is not active" };
  }

  const now = new Date();
  if (promo.validFrom && now < promo.validFrom) {
    return { valid: false, reason: "Promo code is not yet valid" };
  }
  if (promo.validTo && now > promo.validTo) {
    return { valid: false, reason: "Promo code has expired" };
  }

  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return { valid: false, reason: "Promo code has reached maximum uses" };
  }

  if (promo.minOrderAmount != null && subtotal < promo.minOrderAmount) {
    return { valid: false, reason: `Minimum order amount is ${promo.minOrderAmount} AMD` };
  }

  let discountAmount = 0;
  if (promo.type === "percent") {
    discountAmount = Math.round((subtotal * promo.value) / 100);
  } else {
    discountAmount = Math.min(promo.value, subtotal);
  }

  return {
    valid: true,
    discountAmount,
    type: promo.type as "percent" | "fixed",
    value: promo.value,
    code: promo.code,
  };
}

/**
 * Increment usedCount for a promo code (call after order is created).
 */
export async function incrementPromoUsage(code: string): Promise<void> {
  await db.promoCode.updateMany({
    where: { code: code.trim().toUpperCase() },
    data: { usedCount: { increment: 1 } },
  });
}

/** Storefront checkout payment methods. */
export type CheckoutPaymentMethodId = "cash" | "idram" | "arca";

const LEGACY_CASH = new Set(["cash_on_delivery", "cod"]);
const LEGACY_ARCA = new Set(["card", "visa", "mastercard", "idbank", "arca_card"]);

/**
 * Maps request strings to canonical id. Returns `null` if unknown.
 */
export function normalizeCheckoutPaymentMethod(raw: string): CheckoutPaymentMethodId | null {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "cash" || LEGACY_CASH.has(normalized)) {
    return "cash";
  }
  if (normalized === "idram") {
    return "idram";
  }
  if (normalized === "arca" || LEGACY_ARCA.has(normalized)) {
    return "arca";
  }
  return null;
}

/**
 * Resolves payment method for checkout: default `cash` when omitted; throws-style error object for invalid values.
 */
export function resolveCheckoutPaymentMethod(raw: unknown): CheckoutPaymentMethodId {
  if (raw === undefined || raw === null) {
    return "cash";
  }
  if (typeof raw !== "string") {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "paymentMethod must be a string",
    };
  }
  if (raw.trim() === "") {
    return "cash";
  }
  const canonical = normalizeCheckoutPaymentMethod(raw);
  if (canonical === null) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: 'Invalid paymentMethod. Use "cash", "idram", or "arca".',
    };
  }
  return canonical;
}

export function isOnlineCheckoutPaymentMethod(
  method: CheckoutPaymentMethodId,
): method is Exclude<CheckoutPaymentMethodId, "cash"> {
  return method === "idram" || method === "arca";
}

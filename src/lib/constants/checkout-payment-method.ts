/**
 * Storefront checkout payment selection — canonical API values for order payload.
 * `card` is accepted as a legacy alias for Arca (bank-hosted Visa / Mastercard / ArCa).
 */
export type CheckoutPaymentMethodId = "arca" | "idram" | "cash";

const LEGACY_CASH = new Set(["cash_on_delivery", "cod"]);
/** Legacy UI / clients that still send `card` map to Arca redirect flow. */
const LEGACY_ARCA = new Set(["card", "visa", "mastercard", "master_card"]);

/**
 * Maps request strings to canonical id. Returns `null` if unknown.
 */
export function normalizeCheckoutPaymentMethod(raw: string): CheckoutPaymentMethodId | null {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "arca" || normalized === "idram" || normalized === "cash") {
    return normalized;
  }
  if (LEGACY_CASH.has(normalized)) {
    return "cash";
  }
  if (LEGACY_ARCA.has(normalized)) {
    return "arca";
  }
  return null;
}

/**
 * Resolves payment method for checkout: default `cash` when omitted; throws-style error object for invalid values.
 */
export function resolveCheckoutPaymentMethod(raw: unknown): CheckoutPaymentMethodId {
  if (raw === undefined || raw === null) {
    return 'cash';
  }
  if (typeof raw !== 'string') {
    throw {
      status: 400,
      type: 'https://api.shop.am/problems/validation-error',
      title: 'Validation Error',
      detail: 'paymentMethod must be a string',
    };
  }
  if (raw.trim() === '') {
    return 'cash';
  }
  const canonical = normalizeCheckoutPaymentMethod(raw);
  if (canonical === null) {
    throw {
      status: 400,
      type: 'https://api.shop.am/problems/validation-error',
      title: 'Validation Error',
      detail: 'Invalid paymentMethod. Use "arca", "idram", or "cash".',
    };
  }
  return canonical;
}

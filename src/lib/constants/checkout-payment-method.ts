/** Storefront checkout — online card/wallet methods are not enabled in this build. */
export type CheckoutPaymentMethodId = "cash";

const LEGACY_CASH = new Set(["cash_on_delivery", "cod"]);

/**
 * Maps request strings to canonical id. Returns `null` if unknown.
 */
export function normalizeCheckoutPaymentMethod(raw: string): CheckoutPaymentMethodId | null {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "cash") {
    return "cash";
  }
  if (LEGACY_CASH.has(normalized)) {
    return "cash";
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
      detail: 'Invalid paymentMethod. Use "cash".',
    };
  }
  return canonical;
}

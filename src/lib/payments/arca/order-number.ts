/** ArCa/SmartVista merchant orderNumber max length. */
export const ARCA_ORDER_NUMBER_MAX_LENGTH = 32;

/**
 * Builds a merchant-unique ArCa orderNumber.
 * Shop sequential numbers collide with historical WooCommerce registrations
 * on the same IDBank merchant — always include payment id entropy.
 */
export function buildArcaMerchantOrderNumber(
  shopOrderNumber: string,
  paymentId: string,
): string {
  const compactPayment = paymentId.replace(/[^a-zA-Z0-9]/g, "").slice(-10);
  const safeOrder = shopOrderNumber.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16);
  const value = `M${safeOrder}-${compactPayment}`;
  return value.slice(0, ARCA_ORDER_NUMBER_MAX_LENGTH);
}

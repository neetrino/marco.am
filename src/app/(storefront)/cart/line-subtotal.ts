/**
 * Prefer catalog unit price when it is positive; otherwise use snapshot from guest `localStorage` (header / add-to-cart).
 * Prevents cart and checkout showing 0 when `GET /api/v1/products/:slug` returns `price: 0` but the stored row has the real price.
 */
export function resolveGuestUnitPrice(apiPrice: unknown, storedSnapshot?: unknown): number {
  const api = Number(apiPrice);
  const stored = Number(storedSnapshot);
  if (Number.isFinite(api) && api > 0) {
    return api;
  }
  if (Number.isFinite(stored) && stored > 0) {
    return stored;
  }
  return Number.isFinite(api) ? api : 0;
}

/**
 * Line subtotal for cart/checkout: unit price × quantity (numeric coercion for API/JSON edge cases).
 */
export function cartLineSubtotal(price: unknown, quantity: unknown): number {
  const p = Number(price);
  const q = Number(quantity);
  if (!Number.isFinite(p) || !Number.isFinite(q) || q < 1) {
    return 0;
  }
  return p * q;
}

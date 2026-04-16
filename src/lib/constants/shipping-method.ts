/**
 * Values persisted on `Order.shippingMethod` for storefront checkout.
 * Legacy API/clients may still send `delivery` — use {@link normalizeShippingMethod}.
 */
export type ShippingMethodId = 'pickup' | 'courier';

export function normalizeShippingMethod(raw: string | null | undefined): ShippingMethodId {
  if (raw === 'courier' || raw === 'delivery') {
    return 'courier';
  }
  return 'pickup';
}

export function isCourierShipping(method: string | null | undefined): boolean {
  return method === 'courier' || method === 'delivery';
}

import type { Prisma } from "@white-shop/db/prisma";
import { isCourierShipping } from "../constants/shipping-method";
import type { CheckoutData } from "../types/checkout";

/**
 * Normalizes storefront checkout address fields into persisted JSON.
 * Merges first/last name; maps `address` (client) to `addressLine1`.
 */
export function buildOrderAddressJson(
  shippingMethod: string,
  shippingAddress: CheckoutData["shippingAddress"] | undefined,
  firstName?: string,
  lastName?: string
): {
  shippingAddress: Prisma.InputJsonValue | undefined;
  billingAddress: Prisma.InputJsonValue | undefined;
} {
  const fn = firstName?.trim();
  const ln = lastName?.trim();
  const base: Record<string, string> = {};
  if (fn) {
    base.firstName = fn;
  }
  if (ln) {
    base.lastName = ln;
  }

  if (isCourierShipping(shippingMethod) && shippingAddress) {
    const city = shippingAddress.city?.trim() ?? "";
    const line = (
      shippingAddress.addressLine1 ??
      shippingAddress.address ??
      ""
    ).trim();
    const merged: Record<string, string> = {
      ...base,
      ...(line ? { addressLine1: line } : {}),
      ...(city ? { city } : {}),
      countryCode: (shippingAddress.countryCode ?? "AM").toString(),
    };
    const json = JSON.parse(JSON.stringify(merged)) as Prisma.InputJsonValue;
    return { shippingAddress: json, billingAddress: json };
  }

  if (Object.keys(base).length === 0) {
    return { shippingAddress: undefined, billingAddress: undefined };
  }
  const json = JSON.parse(JSON.stringify(base)) as Prisma.InputJsonValue;
  return { shippingAddress: undefined, billingAddress: json };
}

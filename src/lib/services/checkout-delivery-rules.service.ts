import {
  resolveProductClass,
  type ProductClass,
} from "../constants/product-class";

export type CheckoutCartClass = "retail-only" | "wholesale-only" | "mixed";
export type DeliveryPricingRule = "yandex" | "free";

function normalizeProductClasses(
  productClasses: readonly unknown[]
): ProductClass[] {
  return productClasses.map((entry) => resolveProductClass(entry));
}

export function resolveCheckoutCartClass(
  productClasses: readonly unknown[]
): CheckoutCartClass {
  const normalized = normalizeProductClasses(productClasses);
  const hasRetail = normalized.includes("retail");
  const hasWholesale = normalized.includes("wholesale");

  if (hasRetail && hasWholesale) {
    return "mixed";
  }
  if (hasWholesale) {
    return "wholesale-only";
  }
  return "retail-only";
}

export function resolveDeliveryPricingRule(
  cartClass: CheckoutCartClass
): DeliveryPricingRule {
  return cartClass === "retail-only" ? "yandex" : "free";
}

export function shouldChargeCourierShipping(
  productClasses: readonly unknown[]
): boolean {
  const cartClass = resolveCheckoutCartClass(productClasses);
  return resolveDeliveryPricingRule(cartClass) === "yandex";
}

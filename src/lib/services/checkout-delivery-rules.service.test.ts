import { describe, expect, it } from "vitest";
import {
  resolveCheckoutCartClass,
  resolveDeliveryPricingRule,
  shouldChargeCourierShipping,
} from "./checkout-delivery-rules.service";

describe("checkout delivery rules", () => {
  it("treats retail-only carts as yandex-priced delivery", () => {
    const cartClass = resolveCheckoutCartClass(["retail", "retail"]);
    expect(cartClass).toBe("retail-only");
    expect(resolveDeliveryPricingRule(cartClass)).toBe("yandex");
    expect(shouldChargeCourierShipping(["retail"])).toBe(true);
  });

  it("treats wholesale-only carts as free delivery", () => {
    const cartClass = resolveCheckoutCartClass(["wholesale", "wholesale"]);
    expect(cartClass).toBe("wholesale-only");
    expect(resolveDeliveryPricingRule(cartClass)).toBe("free");
    expect(shouldChargeCourierShipping(["wholesale"])).toBe(false);
  });

  it("treats mixed carts as free delivery", () => {
    const cartClass = resolveCheckoutCartClass(["retail", "wholesale"]);
    expect(cartClass).toBe("mixed");
    expect(resolveDeliveryPricingRule(cartClass)).toBe("free");
    expect(shouldChargeCourierShipping(["retail", "wholesale"])).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { isCourierShipping, normalizeShippingMethod } from "./shipping-method";

describe("shipping-method", () => {
  describe("normalizeShippingMethod", () => {
    it("maps courier and legacy delivery to courier", () => {
      expect(normalizeShippingMethod("courier")).toBe("courier");
      expect(normalizeShippingMethod("delivery")).toBe("courier");
    });

    it("defaults unknown values to pickup", () => {
      expect(normalizeShippingMethod(undefined)).toBe("pickup");
      expect(normalizeShippingMethod("")).toBe("pickup");
      expect(normalizeShippingMethod("pickup")).toBe("pickup");
    });
  });

  describe("isCourierShipping", () => {
    it("is true for courier and legacy delivery", () => {
      expect(isCourierShipping("courier")).toBe(true);
      expect(isCourierShipping("delivery")).toBe(true);
      expect(isCourierShipping("pickup")).toBe(false);
    });
  });
});

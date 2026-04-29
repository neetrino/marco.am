import { describe, expect, it } from "vitest";
import {
  normalizeCheckoutPaymentMethod,
  resolveCheckoutPaymentMethod,
} from "./checkout-payment-method";

describe("normalizeCheckoutPaymentMethod", () => {
  it("normalizes cash", () => {
    expect(normalizeCheckoutPaymentMethod("cash")).toBe("cash");
    expect(normalizeCheckoutPaymentMethod("CASH")).toBe("cash");
  });

  it("maps legacy cash synonyms", () => {
    expect(normalizeCheckoutPaymentMethod("cash_on_delivery")).toBe("cash");
    expect(normalizeCheckoutPaymentMethod("cod")).toBe("cash");
  });

  it("returns null for removed or unknown methods", () => {
    expect(normalizeCheckoutPaymentMethod("arca")).toBeNull();
    expect(normalizeCheckoutPaymentMethod("idram")).toBeNull();
    expect(normalizeCheckoutPaymentMethod("card")).toBeNull();
    expect(normalizeCheckoutPaymentMethod("visa")).toBeNull();
    expect(normalizeCheckoutPaymentMethod("mastercard")).toBeNull();
    expect(normalizeCheckoutPaymentMethod("bitcoin")).toBeNull();
  });
});

describe("resolveCheckoutPaymentMethod", () => {
  it("defaults to cash when omitted or blank", () => {
    expect(resolveCheckoutPaymentMethod(undefined)).toBe("cash");
    expect(resolveCheckoutPaymentMethod(null)).toBe("cash");
    expect(resolveCheckoutPaymentMethod("")).toBe("cash");
    expect(resolveCheckoutPaymentMethod("   ")).toBe("cash");
  });

  it("throws for non-string", () => {
    expect(() => resolveCheckoutPaymentMethod(1)).toThrow();
  });

  it("throws for unknown string", () => {
    expect(() => resolveCheckoutPaymentMethod("wire")).toThrow();
    expect(() => resolveCheckoutPaymentMethod("arca")).toThrow();
  });
});

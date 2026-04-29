import { describe, expect, it } from "vitest";
import {
  normalizeCheckoutPaymentMethod,
  resolveCheckoutPaymentMethod,
} from "./checkout-payment-method";

describe("normalizeCheckoutPaymentMethod", () => {
  it("normalizes canonical methods", () => {
    expect(normalizeCheckoutPaymentMethod("arca")).toBe("arca");
    expect(normalizeCheckoutPaymentMethod("idram")).toBe("idram");
    expect(normalizeCheckoutPaymentMethod("cash")).toBe("cash");
    expect(normalizeCheckoutPaymentMethod("ARCA")).toBe("arca");
  });

  it("maps legacy card rails to arca", () => {
    expect(normalizeCheckoutPaymentMethod("card")).toBe("arca");
    expect(normalizeCheckoutPaymentMethod("visa")).toBe("arca");
    expect(normalizeCheckoutPaymentMethod("mastercard")).toBe("arca");
  });

  it("maps legacy cash synonyms", () => {
    expect(normalizeCheckoutPaymentMethod("cash_on_delivery")).toBe("cash");
    expect(normalizeCheckoutPaymentMethod("cod")).toBe("cash");
  });

  it("returns null for unknown", () => {
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
  });
});

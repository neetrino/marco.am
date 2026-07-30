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

  it("normalizes idram and arca", () => {
    expect(normalizeCheckoutPaymentMethod("idram")).toBe("idram");
    expect(normalizeCheckoutPaymentMethod("arca")).toBe("arca");
    expect(normalizeCheckoutPaymentMethod("card")).toBe("arca");
    expect(normalizeCheckoutPaymentMethod("idbank")).toBe("arca");
  });

  it("returns null for unknown methods", () => {
    expect(normalizeCheckoutPaymentMethod("bitcoin")).toBeNull();
    expect(normalizeCheckoutPaymentMethod("wire")).toBeNull();
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

  it("accepts online methods", () => {
    expect(resolveCheckoutPaymentMethod("idram")).toBe("idram");
    expect(resolveCheckoutPaymentMethod("arca")).toBe("arca");
  });
});

import { describe, expect, it } from "vitest";
import {
  safeParseShippingAddressCreate,
  safeParseShippingAddressUpdate,
} from "./shipping-address.schema";

describe("shippingAddressCreateSchema", () => {
  it("accepts minimal valid payload", () => {
    const r = safeParseShippingAddressCreate({
      addressLine1: "  Abovyan 1  ",
      city: " Yerevan ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.addressLine1).toBe("Abovyan 1");
      expect(r.data.city).toBe("Yerevan");
      expect(r.data.countryCode).toBe("AM");
    }
  });

  it("rejects unknown keys", () => {
    const r = safeParseShippingAddressCreate({
      addressLine1: "x",
      city: "y",
      extra: 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty city", () => {
    const r = safeParseShippingAddressCreate({
      addressLine1: "x",
      city: "   ",
    });
    expect(r.success).toBe(false);
  });
});

describe("shippingAddressUpdateSchema", () => {
  it("rejects empty body", () => {
    const r = safeParseShippingAddressUpdate({});
    expect(r.success).toBe(false);
  });

  it("accepts partial city", () => {
    const r = safeParseShippingAddressUpdate({ city: "Gyumri" });
    expect(r.success).toBe(true);
  });
});

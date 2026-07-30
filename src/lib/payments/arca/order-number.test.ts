import { describe, expect, it } from "vitest";
import {
  ARCA_ORDER_NUMBER_MAX_LENGTH,
  buildArcaMerchantOrderNumber,
} from "./order-number";

describe("buildArcaMerchantOrderNumber", () => {
  it("stays within ArCa max length and includes payment entropy", () => {
    const value = buildArcaMerchantOrderNumber("42", "clxyz0123456789abcdef");
    expect(value.length).toBeLessThanOrEqual(ARCA_ORDER_NUMBER_MAX_LENGTH);
    expect(value).toContain("M42-");
    expect(value).not.toBe("42");
  });

  it("differs for different payment ids", () => {
    const a = buildArcaMerchantOrderNumber("100", "payment_aaa_1111111111");
    const b = buildArcaMerchantOrderNumber("100", "payment_bbb_2222222222");
    expect(a).not.toBe(b);
  });
});

import { describe, expect, it } from "vitest";
import { promoCodeRecordSchema } from "./promo-code.schema";

describe("promoCodeRecordSchema", () => {
  it("accepts a valid promo code record", () => {
    const result = promoCodeRecordSchema.safeParse({
      id: "promo-1",
      code: "SPRING_2026",
      isActive: true,
      discountType: "percentage",
      discountValue: 15,
      scope: "all",
    });
    expect(result.success).toBe(true);
  });

  it("rejects percentage greater than 100", () => {
    const result = promoCodeRecordSchema.safeParse({
      id: "promo-2",
      code: "OVERMAX",
      isActive: true,
      discountType: "percentage",
      discountValue: 101,
      scope: "all",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date range", () => {
    const result = promoCodeRecordSchema.safeParse({
      id: "promo-3",
      code: "DATE_RANGE",
      isActive: true,
      discountType: "fixed",
      discountValue: 5000,
      startsAt: "2026-04-20T10:00:00.000Z",
      endsAt: "2026-04-19T10:00:00.000Z",
      scope: "all",
    });
    expect(result.success).toBe(false);
  });
});

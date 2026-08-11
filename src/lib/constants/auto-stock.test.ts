import { describe, expect, it } from "vitest";
import {
  AUTO_STOCK_LEVEL,
  AUTO_STOCK_REPLENISH_THRESHOLD,
  shouldAutoReplenishStock,
} from "./auto-stock";

describe("auto-stock", () => {
  it("uses fixed create/replenish levels", () => {
    expect(AUTO_STOCK_LEVEL).toBe(1000);
    expect(AUTO_STOCK_REPLENISH_THRESHOLD).toBe(50);
  });

  it("replenishes at or below threshold", () => {
    expect(shouldAutoReplenishStock(50)).toBe(true);
    expect(shouldAutoReplenishStock(49)).toBe(true);
    expect(shouldAutoReplenishStock(0)).toBe(true);
    expect(shouldAutoReplenishStock(51)).toBe(false);
    expect(shouldAutoReplenishStock(1000)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { pickBestAndLeastSelling } from "./product-sales-analytics";

describe("pickBestAndLeastSelling", () => {
  it("returns top 5 and bottom 5 among the rest with no overlap", () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      productId: `p${i}`,
      title: `P${i}`,
      sku: `S${i}`,
      totalQuantity: i + 1,
      totalRevenue: (i + 1) * 10,
      orderCount: 1,
    }));
    const { bestSelling, leastSelling } = pickBestAndLeastSelling(rows, 5);
    expect(bestSelling.map((r) => r.productId)).toEqual([
      "p11",
      "p10",
      "p9",
      "p8",
      "p7",
    ]);
    expect(leastSelling.map((r) => r.productId)).toEqual([
      "p0",
      "p1",
      "p2",
      "p3",
      "p4",
    ]);
    const bestIds = new Set(bestSelling.map((b) => b.productId));
    for (const least of leastSelling) {
      expect(bestIds.has(least.productId)).toBe(false);
    }
  });
});

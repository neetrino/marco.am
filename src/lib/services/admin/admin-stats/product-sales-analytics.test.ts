import { describe, expect, it } from "vitest";

import {
  aggregateProductSales,
  pickBestAndLeastSelling,
} from "./product-sales-analytics";

describe("aggregateProductSales", () => {
  it("aggregates quantities and revenue by product", () => {
    const rows = aggregateProductSales([
      {
        items: [
          {
            productTitle: "A",
            sku: "S1",
            quantity: 2,
            total: 20,
            imageUrl: null,
            variantId: "v1",
            variant: {
              sku: "S1",
              product: {
                id: "p1",
                media: [],
                translations: [{ title: "Product A" }],
              },
            },
          },
          {
            productTitle: "A",
            sku: "S2",
            quantity: 1,
            total: 15,
            imageUrl: null,
            variantId: "v2",
            variant: {
              sku: "S2",
              product: {
                id: "p1",
                media: [],
                translations: [{ title: "Product A" }],
              },
            },
          },
        ],
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.productId).toBe("p1");
    expect(rows[0]?.totalQuantity).toBe(3);
    expect(rows[0]?.totalRevenue).toBe(35);
    expect(rows[0]?.orderCount).toBe(2);
  });
});

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
    for (const l of leastSelling) {
      expect(bestIds.has(l.productId)).toBe(false);
    }
  });
});

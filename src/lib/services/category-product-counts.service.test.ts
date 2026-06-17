import { describe, expect, it } from "vitest";
import { buildDistinctSubtreeProductCountMap } from "./category-product-counts.service";

describe("buildDistinctSubtreeProductCountMap", () => {
  it("counts each product once per subtree when linked along ancestor chain", () => {
    const categories = [
      { id: "root", parentId: null },
      { id: "child", parentId: "root" },
      { id: "leaf", parentId: "child" },
    ];
    const products = [
      {
        primaryCategoryId: "leaf",
        categoryIds: ["root", "child", "leaf"],
      },
    ];

    const counts = buildDistinctSubtreeProductCountMap(categories, products);

    expect(counts.get("root")).toBe(1);
    expect(counts.get("child")).toBe(1);
    expect(counts.get("leaf")).toBe(1);
  });

  it("does not inflate parent count by summing per-level direct links", () => {
    const categories = [
      { id: "root", parentId: null },
      { id: "a", parentId: "root" },
      { id: "b", parentId: "root" },
    ];
    const products = [
      { primaryCategoryId: "a", categoryIds: ["root", "a"] },
      { primaryCategoryId: "b", categoryIds: ["root", "b"] },
    ];

    const counts = buildDistinctSubtreeProductCountMap(categories, products);

    expect(counts.get("root")).toBe(2);
    expect(counts.get("a")).toBe(1);
    expect(counts.get("b")).toBe(1);
  });
});

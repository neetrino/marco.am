import { describe, expect, it } from "vitest";
import { buildProductWhereClause } from "./query-builder";

describe("buildProductWhereClause", () => {
  it("combines search and category filters with AND semantics", () => {
    const where = buildProductWhereClause({
      search: "iphone",
      categories: ["phones"],
    });

    expect(where.AND).toBeDefined();
    expect(Array.isArray(where.AND)).toBe(true);
    expect((where.AND as unknown[]).length).toBe(2);
    expect(where.OR).toBeUndefined();
  });

  it("applies brand filter as IN condition", () => {
    const where = buildProductWhereClause({
      brand: ["apple", "samsung"],
    });

    expect(where.AND).toBeDefined();
    expect(JSON.stringify(where)).toContain('"brandId":{"in":["apple","samsung"]}');
  });

  it("applies min and max price range on variants", () => {
    const where = buildProductWhereClause({
      minPrice: 100,
      maxPrice: 200,
    });

    expect(where.AND).toBeDefined();
    expect(JSON.stringify(where)).toContain('"price":{"gte":100,"lte":200}');
  });

  it("applies published filter", () => {
    const where = buildProductWhereClause({
      published: false,
    });

    expect(where.AND).toBeDefined();
    expect(JSON.stringify(where)).toContain('"published":false');
  });
});

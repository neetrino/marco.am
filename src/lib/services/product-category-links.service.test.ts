import { describe, expect, it } from "vitest";
import {
  normalizeProductCategoryLinks,
  type CategoryGraph,
} from "./product-category-links.service";

function graphFromRows(
  rows: Array<{ id: string; parent: string | null }>,
): CategoryGraph {
  return new Map(
    rows.map((row) => [row.id, { id: row.id, parentId: row.parent }]),
  );
}

describe("normalizeProductCategoryLinks", () => {
  const graph = graphFromRows([
    { id: "root", parent: null },
    { id: "mid", parent: "root" },
    { id: "leaf", parent: "mid" },
  ]);

  it("returns empty links when no categories selected", async () => {
    const result = await normalizeProductCategoryLinks({}, undefined, graph);
    expect(result).toEqual({ primaryCategoryId: null, categoryIds: [] });
  });

  it("expands ancestor chain for a leaf subcategory", async () => {
    const result = await normalizeProductCategoryLinks(
      { categoryIds: ["leaf"] },
      undefined,
      graph,
    );

    expect(result.primaryCategoryId).toBe("leaf");
    expect(result.categoryIds).toEqual(["root", "mid", "leaf"]);
  });

  it("keeps explicit primary when it is an ancestor of another selection", async () => {
    const result = await normalizeProductCategoryLinks(
      {
        primaryCategoryId: "mid",
        categoryIds: ["leaf"],
      },
      undefined,
      graph,
    );

    expect(result.primaryCategoryId).toBe("mid");
    expect(result.categoryIds).toEqual(["root", "mid", "leaf"]);
  });

  it("merges multiple explicit branches", async () => {
    const multiGraph = graphFromRows([
      { id: "root-a", parent: null },
      { id: "leaf-a", parent: "root-a" },
      { id: "root-b", parent: null },
      { id: "leaf-b", parent: "root-b" },
    ]);

    const result = await normalizeProductCategoryLinks(
      { categoryIds: ["leaf-a", "leaf-b"] },
      undefined,
      multiGraph,
    );

    expect(result.primaryCategoryId).toBe("leaf-b");
    expect(result.categoryIds).toEqual(["root-b", "leaf-b", "root-a", "leaf-a"]);
  });
});

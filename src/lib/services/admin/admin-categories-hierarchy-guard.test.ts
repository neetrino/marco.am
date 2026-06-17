import { describe, expect, it } from "vitest";
import { assessCategoryHierarchyUpdateRisk } from "./admin-categories-hierarchy-guard";

describe("assessCategoryHierarchyUpdateRisk", () => {
  const tree: Array<{ id: string; parentId: string | null }> = [
    { id: "root", parentId: null },
    { id: "child-a", parentId: "root" },
    { id: "child-b", parentId: "root" },
    { id: "other-root", parentId: null },
    { id: "other-child", parentId: "other-root" },
  ];

  it("requires confirmation when subcategories are removed from parent", () => {
    const result = assessCategoryHierarchyUpdateRisk({
      categoryId: "root",
      currentParentId: null,
      nextParentId: null,
      initialSubcategoryIds: ["child-a", "child-b"],
      nextSubcategoryIds: ["child-a"],
      parentChanged: false,
      subcategoriesChanged: true,
      allCategories: tree,
    });

    expect(result.requiresConfirmation).toBe(true);
    expect(result.reasons).toEqual([{ type: "detach_to_root", categoryIds: ["child-b"] }]);
  });

  it("requires confirmation when category is promoted to root", () => {
    const result = assessCategoryHierarchyUpdateRisk({
      categoryId: "child-a",
      currentParentId: "root",
      nextParentId: null,
      initialSubcategoryIds: [],
      nextSubcategoryIds: [],
      parentChanged: true,
      subcategoriesChanged: false,
      allCategories: tree,
    });

    expect(result.requiresConfirmation).toBe(true);
    expect(result.reasons).toContainEqual({ type: "promote_to_root" });
  });

  it("does not require confirmation for title-only updates", () => {
    const result = assessCategoryHierarchyUpdateRisk({
      categoryId: "root",
      currentParentId: null,
      nextParentId: null,
      initialSubcategoryIds: ["child-a", "child-b"],
      nextSubcategoryIds: ["child-a", "child-b"],
      parentChanged: false,
      subcategoriesChanged: false,
      allCategories: tree,
    });

    expect(result.requiresConfirmation).toBe(false);
  });
});

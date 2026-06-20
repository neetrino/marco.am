export type CategoryHierarchyRow = {
  id: string;
  parentId: string | null;
};

export type HierarchyChangeReason =
  | { type: "detach_to_root"; categoryIds: string[] }
  | { type: "promote_to_root" }
  | { type: "reassign_from_other_parent"; categoryIds: string[] }
  | { type: "clear_all_subcategories"; removedCount: number };

type HierarchyChangeAssessment = {
  requiresConfirmation: boolean;
  reasons: HierarchyChangeReason[];
};

export function assessCategoryHierarchyUpdateRisk(args: {
  categoryId: string;
  currentParentId: string | null;
  nextParentId: string | null;
  initialSubcategoryIds: string[];
  nextSubcategoryIds: string[];
  parentChanged: boolean;
  subcategoriesChanged: boolean;
  allCategories: CategoryHierarchyRow[];
}): HierarchyChangeAssessment {
  const reasons: HierarchyChangeReason[] = [];

  if (args.parentChanged && args.currentParentId !== null && args.nextParentId === null) {
    reasons.push({ type: "promote_to_root" });
  }

  if (args.subcategoriesChanged) {
    const removedIds = args.initialSubcategoryIds.filter(
      (id) => !args.nextSubcategoryIds.includes(id),
    );
    if (args.nextSubcategoryIds.length === 0 && args.initialSubcategoryIds.length > 0) {
      reasons.push({ type: "clear_all_subcategories", removedCount: removedIds.length });
    } else if (removedIds.length > 0) {
      reasons.push({ type: "detach_to_root", categoryIds: removedIds });
    }

    const addedIds = args.nextSubcategoryIds.filter(
      (id) => !args.initialSubcategoryIds.includes(id),
    );
    const stolenIds = addedIds.filter((id) => {
      const row = args.allCategories.find((category) => category.id === id);
      return row?.parentId != null && row.parentId !== args.categoryId;
    });
    if (stolenIds.length > 0) {
      reasons.push({ type: "reassign_from_other_parent", categoryIds: stolenIds });
    }
  }

  return {
    requiresConfirmation: reasons.length > 0,
    reasons,
  };
}

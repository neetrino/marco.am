import type { HierarchyChangeReason } from "@/lib/services/admin/admin-categories-hierarchy-guard";
import {
  assessCategoryHierarchyUpdateRisk,
  type CategoryHierarchyRow,
} from "@/lib/services/admin/admin-categories-hierarchy-guard";
import { showPopupConfirm } from "@/components/popup-service";
import type { LanguageCode } from "@/lib/language";
import type { Category } from "../types";
import { getLocalizedCategoryTitle } from "../utils";

export function buildHierarchyConfirmMessage(
  reasons: HierarchyChangeReason[],
  categories: Category[],
  t: (key: string) => string,
  locale: string,
): string {
  const lines = [t("admin.categories.hierarchyConfirmIntro")];
  const titleById = (id: string): string => {
    const row = categories.find((category) => category.id === id);
    if (!row) {
      return id;
    }
    return getLocalizedCategoryTitle(row, locale as LanguageCode) || row.slug;
  };

  for (const reason of reasons) {
    if (reason.type === "promote_to_root") {
      lines.push(t("admin.categories.hierarchyConfirmPromote"));
      continue;
    }
    if (reason.type === "clear_all_subcategories") {
      lines.push(
        t("admin.categories.hierarchyConfirmClearAll").replace(
          "{count}",
          String(reason.removedCount),
        ),
      );
      continue;
    }
    if (reason.type === "detach_to_root") {
      const names = reason.categoryIds.map(titleById).join(", ");
      lines.push(t("admin.categories.hierarchyConfirmDetach").replace("{names}", names));
      continue;
    }
    if (reason.type === "reassign_from_other_parent") {
      const names = reason.categoryIds.map(titleById).join(", ");
      lines.push(t("admin.categories.hierarchyConfirmReassign").replace("{names}", names));
    }
  }

  return lines.join("\n\n");
}

export async function requestHierarchyChangeConfirmation(args: {
  categoryId: string;
  currentParentId: string | null;
  nextParentId: string | null;
  initialSubcategoryIds: string[];
  nextSubcategoryIds: string[];
  parentChanged: boolean;
  subcategoriesChanged: boolean;
  allCategories: CategoryHierarchyRow[];
  categories: Category[];
  t: (key: string) => string;
  locale: string;
}): Promise<boolean> {
  const assessment = assessCategoryHierarchyUpdateRisk({
    categoryId: args.categoryId,
    currentParentId: args.currentParentId,
    nextParentId: args.nextParentId,
    initialSubcategoryIds: args.initialSubcategoryIds,
    nextSubcategoryIds: args.nextSubcategoryIds,
    parentChanged: args.parentChanged,
    subcategoriesChanged: args.subcategoriesChanged,
    allCategories: args.allCategories,
  });

  if (!assessment.requiresConfirmation) {
    return true;
  }

  const message = buildHierarchyConfirmMessage(
    assessment.reasons,
    args.categories,
    args.t,
    args.locale,
  );
  return showPopupConfirm(message);
}

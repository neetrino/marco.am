import type { ApiLocale } from "@/lib/i18n/api-locale";

/** Sentinel when a product has no primary or secondary category id. */
export const COMPARE_UNCATEGORIZED_ID = "__uncategorized__" as const;

export function resolveCompareCategoryId(product: {
  primaryCategoryId: string | null;
  categoryIds: string[];
}): string {
  if (product.primaryCategoryId) {
    return product.primaryCategoryId;
  }
  if (product.categoryIds.length > 0) {
    return product.categoryIds[0]!;
  }
  return COMPARE_UNCATEGORIZED_ID;
}

export function uncategorizedCategoryTitle(locale: ApiLocale): string {
  if (locale === "hy") {
    return "Այլ";
  }
  if (locale === "ru") {
    return "Прочее";
  }
  return "Other";
}

export type CompareCategoryProductPick = {
  primaryCategoryId: string | null;
  categoryIds: string[];
};

export type CompareLinePick = { productId: string };

/**
 * Greedy keep order: at most `maxPerCategory` per resolved category key and at most `maxList` lines total.
 */
export function filterCompareLinesByCategoryLimits<T extends CompareLinePick>(
  lines: readonly T[],
  productById: Map<string, CompareCategoryProductPick>,
  maxPerCategory: number,
  maxList: number,
): T[] {
  const countsByKey = new Map<string, number>();
  const out: T[] = [];
  for (const line of lines) {
    const p = productById.get(line.productId);
    if (!p) {
      continue;
    }
    const key = resolveCompareCategoryId(p);
    const n = countsByKey.get(key) ?? 0;
    if (n >= maxPerCategory) {
      continue;
    }
    if (out.length >= maxList) {
      break;
    }
    countsByKey.set(key, n + 1);
    out.push(line);
  }
  return out;
}

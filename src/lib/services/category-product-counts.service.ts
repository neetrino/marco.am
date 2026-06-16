import {
  buildCategoryChildMap,
  collectDescendantIds,
  type CategoryChildMap,
} from "@/lib/services/category-subtree.service";

export type ProductCategoryLinkRow = {
  primaryCategoryId: string | null;
  categoryIds: string[];
};

function collectSubtreeIdsIncludingSelf(
  rootCategoryId: string,
  childMap: CategoryChildMap,
): string[] {
  return [rootCategoryId, ...collectDescendantIds(rootCategoryId, childMap)];
}

function productLinkedCategoryIds(product: ProductCategoryLinkRow): Set<string> {
  const linked = new Set<string>();
  if (product.primaryCategoryId) {
    linked.add(product.primaryCategoryId);
  }
  for (const categoryId of product.categoryIds) {
    linked.add(categoryId);
  }
  return linked;
}

/**
 * Distinct product counts per category subtree (category + descendants).
 *
 * Summing per-level direct counts double-counts products linked along ancestor
 * chains; this matches storefront facet counts and category filters.
 */
export function buildDistinctSubtreeProductCountMap(
  categoryRows: Array<{ id: string; parentId: string | null }>,
  products: ProductCategoryLinkRow[],
): Map<string, number> {
  const childMap = buildCategoryChildMap(categoryRows);
  const subtreeByCategoryId = new Map<string, Set<string>>();

  for (const row of categoryRows) {
    subtreeByCategoryId.set(
      row.id,
      new Set(collectSubtreeIdsIncludingSelf(row.id, childMap)),
    );
  }

  const counts = new Map<string, number>(
    categoryRows.map((row) => [row.id, 0]),
  );

  for (const product of products) {
    const linked = productLinkedCategoryIds(product);
    for (const [categoryId, subtreeIds] of subtreeByCategoryId) {
      let matches = false;
      for (const linkedId of linked) {
        if (subtreeIds.has(linkedId)) {
          matches = true;
          break;
        }
      }
      if (matches) {
        counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
      }
    }
  }

  return counts;
}

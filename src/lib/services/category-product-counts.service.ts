type ProductCategoryLinkRow = {
  primaryCategoryId: string | null;
  categoryIds: string[];
};

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

function buildParentById(
  categoryRows: Array<{ id: string; parentId: string | null }>,
): Map<string, string | null> {
  return new Map(categoryRows.map((row) => [row.id, row.parentId]));
}

/** Category ids whose subtree contains `categoryId` (self + ancestors). */
function collectSubtreeRootIds(
  categoryId: string,
  parentById: Map<string, string | null>,
): string[] {
  const roots: string[] = [];
  let current: string | null = categoryId;
  const visited = new Set<string>();

  while (current && !visited.has(current)) {
    visited.add(current);
    roots.push(current);
    current = parentById.get(current) ?? null;
  }

  return roots;
}

/**
 * Distinct product counts per category subtree (category + descendants).
 *
 * A product linked to category L increments every category C where L lies in
 * subtree(C) — equivalently, C is L or an ancestor of L. This replaces the
 * previous O(categories × products) scan with O(products × links × depth).
 */
export function buildDistinctSubtreeProductCountMap(
  categoryRows: Array<{ id: string; parentId: string | null }>,
  products: ProductCategoryLinkRow[],
): Map<string, number> {
  const parentById = buildParentById(categoryRows);
  const counts = new Map<string, number>(
    categoryRows.map((row) => [row.id, 0]),
  );

  for (const product of products) {
    const matchingCategories = new Set<string>();
    for (const linkedId of productLinkedCategoryIds(product)) {
      for (const rootId of collectSubtreeRootIds(linkedId, parentById)) {
        if (counts.has(rootId)) {
          matchingCategories.add(rootId);
        }
      }
    }

    for (const categoryId of matchingCategories) {
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    }
  }

  return counts;
}

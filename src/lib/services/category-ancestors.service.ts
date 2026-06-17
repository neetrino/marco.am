import { db } from "@white-shop/db";

/** Guards against accidental cycles in the category tree. */
const MAX_CATEGORY_ANCESTOR_DEPTH = 64;

export type CategoryParentMap = Map<string, string | null>;

/**
 * Loads `id -> parentId` for every active category.
 *
 * Kept intentionally fresh (no cache) so category counts reflect hierarchy
 * edits immediately; the query touches only two small columns.
 */
export async function loadCategoryParentMap(): Promise<CategoryParentMap> {
  const rows = await db.category.findMany({
    where: { deletedAt: null },
    select: { id: true, parentId: true },
  });
  return new Map(rows.map((row) => [row.id, row.parentId]));
}

/**
 * Expands a set of category ids to include every ancestor.
 *
 * Counting a product against the ancestors of its directly-linked categories
 * makes facet badges agree with the descendant-expanding category filter and
 * compensates for products whose stored `categoryIds` omit the parent chain.
 */
export function expandCategoryIdsWithAncestors(
  ids: Iterable<string>,
  parentMap: CategoryParentMap,
): Set<string> {
  const expanded = new Set<string>();
  for (const id of ids) {
    let current: string | null | undefined = id;
    let guard = 0;
    while (current && !expanded.has(current) && guard < MAX_CATEGORY_ANCESTOR_DEPTH) {
      guard += 1;
      expanded.add(current);
      current = parentMap.get(current) ?? null;
    }
  }
  return expanded;
}

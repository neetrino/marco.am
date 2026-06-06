import { db } from "@white-shop/db";

type CategoryParentRow = {
  id: string;
  parentId: string | null;
};

export type CategoryChildMap = Map<string, string[]>;

export function buildCategoryChildMap(rows: CategoryParentRow[]): CategoryChildMap {
  const childMap: CategoryChildMap = new Map();

  for (const row of rows) {
    if (!row.parentId) {
      continue;
    }
    const siblings = childMap.get(row.parentId) ?? [];
    siblings.push(row.id);
    childMap.set(row.parentId, siblings);
  }

  return childMap;
}

export function collectDescendantIds(
  rootCategoryId: string,
  childMap: CategoryChildMap,
): string[] {
  const descendants: string[] = [];
  const stack = [...(childMap.get(rootCategoryId) ?? [])];

  while (stack.length > 0) {
    const current = stack.pop()!;
    descendants.push(current);
    stack.push(...(childMap.get(current) ?? []));
  }

  return descendants;
}

export function collectAncestorIds(
  categoryId: string,
  byId: Map<string, CategoryParentRow>,
): string[] {
  const ancestors: string[] = [];
  let current = byId.get(categoryId)?.parentId ?? null;
  let guard = 0;

  while (current && guard < 64) {
    guard += 1;
    ancestors.push(current);
    current = byId.get(current)?.parentId ?? null;
  }

  return ancestors;
}

/**
 * Expands selected category IDs to include all non-deleted descendants.
 */
export async function expandCategoryIdsWithDescendants(
  categoryIds: string[],
  options?: { publishedOnly?: boolean },
): Promise<string[]> {
  if (categoryIds.length === 0) {
    return [];
  }

  const publishedOnly = options?.publishedOnly ?? false;
  const rows = await db.category.findMany({
    where: {
      deletedAt: null,
      ...(publishedOnly ? { published: true } : {}),
    },
    select: { id: true, parentId: true },
  });

  const childMap = buildCategoryChildMap(rows);
  const expanded = new Set<string>();

  for (const categoryId of categoryIds) {
    expanded.add(categoryId);
    for (const descendantId of collectDescendantIds(categoryId, childMap)) {
      expanded.add(descendantId);
    }
  }

  return [...expanded];
}

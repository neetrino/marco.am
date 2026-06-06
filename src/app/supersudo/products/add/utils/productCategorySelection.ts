type CategoryWithParent = {
  id: string;
  parentId?: string | null;
};

export function buildCategoryParentMap(
  categories: CategoryWithParent[],
): Map<string, CategoryWithParent> {
  return new Map(categories.map((category) => [category.id, category]));
}

export function buildCategoryChildMap(
  categories: CategoryWithParent[],
): Map<string, string[]> {
  const childMap = new Map<string, string[]>();

  for (const category of categories) {
    if (!category.parentId) {
      continue;
    }
    const siblings = childMap.get(category.parentId) ?? [];
    siblings.push(category.id);
    childMap.set(category.parentId, siblings);
  }

  return childMap;
}

export function collectCategoryAncestorIds(
  categoryId: string,
  byId: Map<string, CategoryWithParent>,
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

export function collectCategoryDescendantIds(
  categoryId: string,
  childMap: Map<string, string[]>,
): string[] {
  const descendants: string[] = [];
  const stack = [...(childMap.get(categoryId) ?? [])];

  while (stack.length > 0) {
    const current = stack.pop()!;
    descendants.push(current);
    stack.push(...(childMap.get(current) ?? []));
  }

  return descendants;
}

export function applyProductCategorySelectionChange(
  categoryIds: string[],
  categoryId: string,
  checked: boolean,
  categories: CategoryWithParent[],
): string[] {
  const byId = buildCategoryParentMap(categories);
  const childMap = buildCategoryChildMap(categories);

  if (checked) {
    return [
      ...new Set([
        ...categoryIds,
        categoryId,
        ...collectCategoryAncestorIds(categoryId, byId),
      ]),
    ];
  }

  const toRemove = new Set([
    categoryId,
    ...collectCategoryDescendantIds(categoryId, childMap),
  ]);

  return categoryIds.filter((id) => !toRemove.has(id));
}

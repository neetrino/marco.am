export type ShopCategoryFilterTreeNode = {
  slug: string;
  children?: readonly ShopCategoryFilterTreeNode[];
};

function normalizeCategorySlug(slug: string): string {
  return slug.trim().toLowerCase();
}

/**
 * Slugs of category rows that must stay expanded so every selected slug is visible
 * in the shop sidebar (opens ancestors; does not collapse user-expanded rows).
 */
export function collectCategoryFilterExpandKeys(
  tree: readonly ShopCategoryFilterTreeNode[],
  selectedSlugs: readonly string[],
): ReadonlySet<string> {
  const normalizedSelected = new Set(
    selectedSlugs.map(normalizeCategorySlug).filter(Boolean),
  );
  if (normalizedSelected.size === 0) {
    return new Set();
  }

  const expandKeys = new Set<string>();

  function walk(node: ShopCategoryFilterTreeNode, ancestorKeys: readonly string[]): boolean {
    const key = normalizeCategorySlug(node.slug);
    const isSelected = normalizedSelected.has(key);
    let hasSelectedInSubtree = isSelected;

    for (const child of node.children ?? []) {
      if (walk(child, [...ancestorKeys, key])) {
        hasSelectedInSubtree = true;
      }
    }

    if (hasSelectedInSubtree) {
      for (const ancestorKey of ancestorKeys) {
        expandKeys.add(ancestorKey);
      }
    }

    return hasSelectedInSubtree;
  }

  for (const root of tree) {
    walk(root, []);
  }

  return expandKeys;
}

/**
 * Deepest selected slug in the tree — used to scroll the sidebar to the active subcategory.
 */
export function findDeepestSelectedCategorySlug(
  tree: readonly ShopCategoryFilterTreeNode[],
  selectedSlugs: readonly string[],
): string | null {
  const normalizedSelected = new Set(
    selectedSlugs.map(normalizeCategorySlug).filter(Boolean),
  );
  if (normalizedSelected.size === 0) {
    return null;
  }

  let deepestSlug: string | null = null;
  let deepestDepth = -1;

  function walk(node: ShopCategoryFilterTreeNode, depth: number): void {
    const key = normalizeCategorySlug(node.slug);
    if (normalizedSelected.has(key) && depth > deepestDepth) {
      deepestSlug = node.slug;
      deepestDepth = depth;
    }
    for (const child of node.children ?? []) {
      walk(child, depth + 1);
    }
  }

  for (const root of tree) {
    walk(root, 0);
  }

  return deepestSlug;
}

function collectNodeAndDescendantSlugs(node: ShopCategoryFilterTreeNode): string[] {
  const slugs = [node.slug.toLowerCase()];
  for (const child of node.children ?? []) {
    slugs.push(...collectNodeAndDescendantSlugs(child));
  }
  return slugs;
}

function buildSlugToDescendantsMap(
  tree: readonly ShopCategoryFilterTreeNode[],
): Map<string, ReadonlySet<string>> {
  const map = new Map<string, ReadonlySet<string>>();

  function walk(node: ShopCategoryFilterTreeNode): void {
    map.set(node.slug.toLowerCase(), new Set(collectNodeAndDescendantSlugs(node)));
    for (const child of node.children ?? []) {
      walk(child);
    }
  }

  for (const root of tree) {
    walk(root);
  }

  return map;
}

/**
 * Resolves selected category slugs to a set that includes each slug and all of its descendants.
 * Falls back to direct slug matching when the tree is empty or a slug is missing from the tree.
 */
export function buildAllowedCategorySlugs(
  tree: readonly ShopCategoryFilterTreeNode[] | undefined,
  selectedSlugs: readonly string[],
): ReadonlySet<string> {
  const normalizedSelected = selectedSlugs
    .map((slug) => slug.trim())
    .filter(Boolean)
    .map((slug) => slug.toLowerCase());

  const allowed = new Set<string>();
  if (normalizedSelected.length === 0) {
    return allowed;
  }

  if (!tree?.length) {
    normalizedSelected.forEach((slug) => allowed.add(slug));
    return allowed;
  }

  const descendantsBySlug = buildSlugToDescendantsMap(tree);
  for (const slug of normalizedSelected) {
    const descendants = descendantsBySlug.get(slug);
    if (descendants) {
      descendants.forEach((value) => allowed.add(value));
      continue;
    }
    allowed.add(slug);
  }

  return allowed;
}

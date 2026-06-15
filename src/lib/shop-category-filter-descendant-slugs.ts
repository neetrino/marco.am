export type ShopCategoryFilterTreeNode = {
  slug: string;
  children?: readonly ShopCategoryFilterTreeNode[];
};

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

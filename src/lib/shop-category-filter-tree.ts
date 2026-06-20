export type ShopCategoryFilterRow = {
  id: string;
  parentId: string | null;
  position: number;
  slug: string;
  title: string;
};
type CategoryFilterTreeNode = {
  slug: string;
  title: string;
  count: number;
  children: CategoryFilterTreeNode[];
};

type TreeNodeWithId = {
  id: string;
  slug: string;
  title: string;
  count: number;
  children: TreeNodeWithId[];
};

function pruneTreeWithNavSlots(
  nodes: TreeNodeWithId[],
  keepEmptyProductNavIds: ReadonlySet<string>,
): TreeNodeWithId[] {
  return nodes
    .map((n) => ({
      ...n,
      children: pruneTreeWithNavSlots(n.children, keepEmptyProductNavIds),
    }))
    .filter(
      (n) =>
        n.count > 0 ||
        n.children.length > 0 ||
        keepEmptyProductNavIds.has(n.id),
    );
}

function stripIds(nodes: TreeNodeWithId[]): CategoryFilterTreeNode[] {
  return nodes.map((n) => ({
    slug: n.slug,
    title: n.title,
    count: n.count,
    children: stripIds(n.children),
  }));
}

/**
 * Build ordered parent → child nodes for the shop category filter sidebar.
 * Rows must include every node to display; `counts` holds facet counts per category id.
 * `keepEmptyProductNavIds`: category ids loaded from DB for navigation (zero facet count) — kept as leaves so parents stay expandable.
 */
export function buildShopCategoryFilterTree(
  rows: ShopCategoryFilterRow[],
  counts: Map<string, number>,
  keepEmptyProductNavIds: ReadonlySet<string> = new Set(),
): CategoryFilterTreeNode[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const roots = rows.filter((r) => !r.parentId || !byId.has(r.parentId));
  roots.sort((a, b) => a.position - b.position);

  function buildNode(row: ShopCategoryFilterRow): TreeNodeWithId {
    const childRows = rows
      .filter((x) => x.parentId === row.id)
      .sort((a, b) => a.position - b.position);
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      count: counts.get(row.id) ?? 0,
      children: childRows.map(buildNode),
    };
  }

  const built = roots.map(buildNode);
  return stripIds(pruneTreeWithNavSlots(built, keepEmptyProductNavIds));
}

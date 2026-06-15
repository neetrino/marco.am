import type { ShopCategoryFilterTreeNode } from '@/lib/shop-category-filter-descendant-slugs';

let categoryFilterTree: readonly ShopCategoryFilterTreeNode[] = [];

/** Syncs the latest sidebar category tree for PLP optimistic listing filters. */
export function setShopCategoryFilterTree(
  tree: readonly ShopCategoryFilterTreeNode[],
): void {
  categoryFilterTree = tree;
}

export function getShopCategoryFilterTree(): readonly ShopCategoryFilterTreeNode[] {
  return categoryFilterTree;
}

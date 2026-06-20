import type { Category } from '../types';

export type CategoryTreeNode = Category & { children: CategoryTreeNode[] };

/** Builds nested category tree (roots with children arrays). */
export function buildCategoryTreeNodes(categories: Category[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>();
  const rootCategories: CategoryTreeNode[] = [];

  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  categories.forEach((category) => {
    const node = categoryMap.get(category.id)!;
    if (category.parentId && categoryMap.has(category.parentId)) {
      categoryMap.get(category.parentId)!.children.push(node);
    } else {
      rootCategories.push(node);
    }
  });

  return rootCategories;
}

const INDENT_PER_LEVEL_PX = 16;

export function getCategoryNodeTitle(
  node: CategoryTreeNode,
  getLabel?: (category: Category) => string,
): string {
  return getLabel ? getLabel(node) : node.title;
}

export function categoryNodeTitleMatches(
  node: CategoryTreeNode,
  query: string,
  getLabel?: (category: Category) => string,
): boolean {
  return getCategoryNodeTitle(node, getLabel).toLowerCase().includes(query);
}

export function categorySubtreeHasMatch(
  node: CategoryTreeNode,
  query: string,
  getLabel?: (category: Category) => string,
): boolean {
  if (categoryNodeTitleMatches(node, query, getLabel)) {
    return true;
  }
  return node.children.some((child) => categorySubtreeHasMatch(child, query, getLabel));
}

/** Collect category IDs that must be expanded so search matches stay visible. */
export function collectCategorySearchExpandedIds(
  nodes: CategoryTreeNode[],
  query: string,
  getLabel?: (category: Category) => string,
): Set<string> {
  const expanded = new Set<string>();

  const walk = (node: CategoryTreeNode): boolean => {
    const childMatches = node.children.map((child) => walk(child));
    const hasMatchingChild = childMatches.some(Boolean);
    const selfMatches = categoryNodeTitleMatches(node, query, getLabel);

    if (hasMatchingChild && node.children.length > 0) {
      expanded.add(node.id);
    }

    return selfMatches || hasMatchingChild;
  };

  nodes.forEach((node) => walk(node));
  return expanded;
}

export { INDENT_PER_LEVEL_PX };

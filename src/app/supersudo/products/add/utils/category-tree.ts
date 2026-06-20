import type { Category } from '../types';

type CategoryTreeNode = Category & { children: CategoryTreeNode[] };

type FlatCategoryNode = CategoryTreeNode & {
  isSubcategory: boolean;
  depth: number;
  depthClass: string;
};

function depthPaddingClass(depth: number): string {
  if (depth <= 0) return '';
  if (depth === 1) return 'pl-5';
  if (depth === 2) return 'pl-9';
  if (depth === 3) return 'pl-12';
  return 'pl-14';
}

function flattenTree(
  nodes: CategoryTreeNode[],
  depth = 0,
  result: FlatCategoryNode[] = [],
): FlatCategoryNode[] {
  for (const node of nodes) {
    result.push({
      ...node,
      isSubcategory: depth > 0,
      depth,
      depthClass: depthPaddingClass(depth),
    });
    if (node.children.length > 0) {
      flattenTree(node.children, depth + 1, result);
    }
  }
  return result;
}

/** Builds a flat, depth-indented category list for the catalog picker. */
export function buildFlatCategoryTree(categories: Category[]): FlatCategoryNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>();
  const rootCategories: CategoryTreeNode[] = [];

  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  categories.forEach((category) => {
    if (category.parentId && categoryMap.has(category.parentId)) {
      categoryMap.get(category.parentId)!.children.push(categoryMap.get(category.id)!);
    } else {
      rootCategories.push(categoryMap.get(category.id)!);
    }
  });

  return flattenTree(rootCategories);
}

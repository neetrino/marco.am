import type { Category, CategoryWithLevel } from './types';

/**
 * Build category tree with hierarchy levels
 */
export function buildCategoryTree(categories: Category[]): CategoryWithLevel[] {
  type CategoryWithLevelInternal = Category & { level: number; children?: CategoryWithLevelInternal[] };
  
  const categoryMap = new Map<string, CategoryWithLevelInternal>();
  const rootCategories: CategoryWithLevelInternal[] = [];

  // First pass: create map
  categories.forEach(cat => {
    const { children: _children, ...catWithoutChildren } = cat;
    categoryMap.set(cat.id, { ...catWithoutChildren, level: 0 });
  });

  // Second pass: build tree
  categories.forEach(cat => {
    const categoryNode = categoryMap.get(cat.id)!;
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      const parent = categoryMap.get(cat.parentId)!;
      if (!parent.children) {
        parent.children = [];
      }
      categoryNode.level = (parent.level || 0) + 1;
      parent.children.push(categoryNode);
    } else {
      rootCategories.push(categoryNode);
    }
  });

  // Flatten tree for display
  const flattenTree = (
    nodes: CategoryWithLevelInternal[], 
    result: CategoryWithLevel[] = []
  ): CategoryWithLevel[] => {
    nodes.forEach(node => {
      result.push({ ...node, level: node.level });
      if (node.children) {
        flattenTree(node.children, result);
      }
    });
    return result;
  };

  return flattenTree(rootCategories);
}

/**
 * Get all descendant IDs for the provided category.
 */
export function getDescendantIds(categories: Category[], categoryId: string): Set<string> {
  const childrenByParentId = new Map<string, string[]>();

  categories.forEach((category) => {
    if (!category.parentId) {
      return;
    }

    const siblings = childrenByParentId.get(category.parentId) ?? [];
    siblings.push(category.id);
    childrenByParentId.set(category.parentId, siblings);
  });

  const descendants = new Set<string>();
  const stack = [...(childrenByParentId.get(categoryId) ?? [])];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || descendants.has(currentId)) {
      continue;
    }

    descendants.add(currentId);
    const childIds = childrenByParentId.get(currentId) ?? [];
    stack.push(...childIds);
  }

  return descendants;
}

/**
 * Get all ancestor IDs for the provided category.
 */
export function getAncestorIds(categories: Category[], categoryId: string): Set<string> {
  const parentByCategoryId = new Map<string, string | null>();
  categories.forEach((category) => {
    parentByCategoryId.set(category.id, category.parentId);
  });

  const ancestors = new Set<string>();
  let currentParentId = parentByCategoryId.get(categoryId) ?? null;

  while (currentParentId) {
    if (ancestors.has(currentParentId)) {
      break;
    }

    ancestors.add(currentParentId);
    currentParentId = parentByCategoryId.get(currentParentId) ?? null;
  }

  return ancestors;
}





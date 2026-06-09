import type { LanguageCode } from '../../lib/language';
import { isExcludedHeaderNavCategory } from '../../lib/constants/excluded-shop-category-slugs';
import type { Category } from './category-nav-types';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';

export function normalizeCategoryKey(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ');
}

function isCategoryAllowedByExclusion(category: Category, lang: LanguageCode): boolean {
  if (category.showInHeader) {
    return true;
  }
  const presentation = resolveCategoryNavPresentation(category.slug, category.title, lang);
  return (
    !isExcludedHeaderNavCategory(category.slug, category.title) &&
    !isExcludedHeaderNavCategory(category.slug, presentation.title)
  );
}

/** Pre-order walk: every descendant of `nodes`, including intermediate parents. */
export function flattenCategorySubtree(nodes: readonly Category[]): Category[] {
  const result: Category[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children.length > 0) {
      result.push(...flattenCategorySubtree(node.children));
    }
  }
  return result;
}

/** Drop legacy/duplicate nav rows only — keep every distinct DB category. */
export function filterCategoriesForNav(categories: Category[], lang: LanguageCode): Category[] {
  return categories.filter((category) => isCategoryAllowedByExclusion(category, lang) && hasRenderableBranch(category, lang));
}

function childrenCount(category: Category): number {
  return category.children.length;
}

function subtreeProductCount(category: Category): number {
  const own = category.productCount ?? 0;
  return category.children.reduce((sum, child) => sum + subtreeProductCount(child), own);
}

function hasRenderableBranch(category: Category, lang: LanguageCode): boolean {
  if (category.showInHeader) {
    return true;
  }
  if (subtreeProductCount(category) > 0) {
    return true;
  }
  return category.children.some(
    (child) => isCategoryAllowedByExclusion(child, lang) && hasRenderableBranch(child, lang),
  );
}

function hasRenderableChildForSidebar(category: Category, lang: LanguageCode): boolean {
  if (category.showInHeader) {
    return true;
  }
  return category.children.some((child) => isCategoryAllowedByExclusion(child, lang) && hasRenderableBranch(child, lang));
}

function hasCategoryMedia(category: Category): boolean {
  return Array.isArray(category.media) && category.media.some((item) => typeof item === 'string' && item.trim().length > 0);
}

function shouldReplaceCategory(existing: Category, candidate: Category): boolean {
  const existingProducts = subtreeProductCount(existing);
  const candidateProducts = subtreeProductCount(candidate);
  if (existingProducts !== candidateProducts) {
    return candidateProducts > existingProducts;
  }

  const existingCount = childrenCount(existing);
  const candidateCount = childrenCount(candidate);
  if (existingCount === 0 && candidateCount > 0) {
    return true;
  }
  if (candidateCount === existingCount && hasCategoryMedia(candidate) && !hasCategoryMedia(existing)) {
    return true;
  }
  return candidateCount > existingCount;
}

function mergeCategoryMedia(preferred: Category, fallback: Category): Category {
  if (hasCategoryMedia(preferred) || !hasCategoryMedia(fallback)) {
    return preferred;
  }
  return {
    ...preferred,
    media: fallback.media,
  };
}

/** Merge rows that share the same localized nav label (legacy duplicate roots only). */
export function dedupeCategories(categories: Category[], lang: LanguageCode): Category[] {
  const keyToIndex = new Map<string, number>();
  const result: Category[] = [];
  const pinnedCategoryIds = new Set<string>();

  for (const category of categories) {
    if (!isCategoryAllowedByExclusion(category, lang) || !hasRenderableChildForSidebar(category, lang)) {
      continue;
    }

    if (category.showInHeader) {
      if (!pinnedCategoryIds.has(category.id)) {
        result.push(category);
        pinnedCategoryIds.add(category.id);
      }
      continue;
    }

    const presentation = resolveCategoryNavPresentation(category.slug, category.title, lang);
    const key = normalizeCategoryKey(presentation.title);

    const existingIndex = keyToIndex.get(key);
    if (existingIndex === undefined) {
      keyToIndex.set(key, result.length);
      result.push(category);
      continue;
    }
    if (shouldReplaceCategory(result[existingIndex], category)) {
      result[existingIndex] = mergeCategoryMedia(category, result[existingIndex]);
      continue;
    }
    result[existingIndex] = mergeCategoryMedia(result[existingIndex], category);
  }

  return result;
}

/** Root list for header nav — all published storefront roots from the API. */
export function prepareRootCategoriesForNav(categories: Category[], lang: LanguageCode): Category[] {
  return dedupeCategories(categories, lang);
}

/** Full descendant list for mega menu / drawer (not only direct children). */
export function prepareSubcategoriesForNav(root: Category, lang: LanguageCode): Category[] {
  return filterCategoriesForNav(flattenCategorySubtree(root.children), lang);
}

export type MegaMenuSubcategoryGroup = {
  parent: Category;
  descendants: Category[];
};

/**
 * Group root descendants by direct child for mega-menu:
 * - `parent`: direct child of selected root
 * - `descendants`: flattened subtree under that child (excludes the parent itself)
 */
export function prepareMegaMenuSubcategoryGroups(
  root: Category,
  lang: LanguageCode,
): MegaMenuSubcategoryGroup[] {
  const directChildren = filterCategoriesForNav(root.children, lang);
  return directChildren.map((child) => ({
    parent: child,
    descendants: filterCategoriesForNav(flattenCategorySubtree(child.children), lang),
  }));
}

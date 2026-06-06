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
  return categories.filter((category) => {
    const presentation = resolveCategoryNavPresentation(category.slug, category.title, lang);
    return (
      !isExcludedHeaderNavCategory(category.slug, category.title) &&
      !isExcludedHeaderNavCategory(category.slug, presentation.title)
    );
  });
}

function childrenCount(category: Category): number {
  return category.children.length;
}

function subtreeProductCount(category: Category): number {
  const own = category.productCount ?? 0;
  return category.children.reduce((sum, child) => sum + subtreeProductCount(child), own);
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

  for (const category of categories) {
    const presentation = resolveCategoryNavPresentation(category.slug, category.title, lang);
    if (
      isExcludedHeaderNavCategory(category.slug, category.title) ||
      isExcludedHeaderNavCategory(category.slug, presentation.title)
    ) {
      continue;
    }
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
  return filterCategoriesForNav(categories, lang);
}

/** Full descendant list for mega menu / drawer (not only direct children). */
export function prepareSubcategoriesForNav(root: Category, lang: LanguageCode): Category[] {
  return filterCategoriesForNav(flattenCategorySubtree(root.children), lang);
}

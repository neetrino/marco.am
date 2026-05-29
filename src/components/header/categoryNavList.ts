import type { LanguageCode } from '../../lib/language';
import { isExcludedShopCategory } from '../../lib/constants/excluded-shop-category-slugs';
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

function childrenCount(category: Category): number {
  return category.children.length;
}

function hasCategoryMedia(category: Category): boolean {
  return Array.isArray(category.media) && category.media.some((item) => typeof item === 'string' && item.trim().length > 0);
}

function shouldReplaceCategory(existing: Category, candidate: Category): boolean {
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

/** Same ordering and merge rules as the desktop categories mega menu. */
export function dedupeCategories(categories: Category[], lang: LanguageCode): Category[] {
  const keyToIndex = new Map<string, number>();
  const result: Category[] = [];

  for (const category of categories) {
    const presentation = resolveCategoryNavPresentation(category.slug, category.title, lang);
    if (
      isExcludedShopCategory(category.slug, category.title) ||
      isExcludedShopCategory(category.slug, presentation.title)
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

/** Root list for header nav: keep DB roots and apply only shared dedupe rules. */
export function prepareRootCategoriesForNav(categories: Category[], lang: LanguageCode): Category[] {
  return dedupeCategories(categories, lang);
}

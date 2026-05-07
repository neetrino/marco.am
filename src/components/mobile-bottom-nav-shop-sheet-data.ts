'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';
import { subscribeShopCategoryTreeUpdated } from '../lib/shop-category-tree-sync';
import type { CategoriesResponse, Category } from './header/category-nav-types';

const CATEGORY_SEARCH_LANGUAGES = ['en', 'hy', 'ru'] as const;

export type CategorySearchIndex = Record<string, string[]>;

export function normalizeSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function flattenCategoryTree(categories: Category[]): Category[] {
  const flattened: Category[] = [];
  categories.forEach((category) => {
    flattened.push(category);
    if (category.children.length > 0) {
      flattened.push(...flattenCategoryTree(category.children));
    }
  });
  return flattened;
}

function collectCategorySearchValues(categories: Category[], index: Map<string, Set<string>>): void {
  categories.forEach((category) => {
    const values = index.get(category.id) ?? new Set<string>();
    values.add(category.title);
    index.set(category.id, values);
    if (category.children.length > 0) {
      collectCategorySearchValues(category.children, index);
    }
  });
}

function buildCategorySearchIndex(trees: Category[][]): CategorySearchIndex {
  const index = new Map<string, Set<string>>();
  trees.forEach((tree) => collectCategorySearchValues(tree, index));

  return Object.fromEntries(
    Array.from(index.entries()).map(([categoryId, values]) => [categoryId, Array.from(values)]),
  );
}

export function useMobileShopCategories(open: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchIndex, setSearchIndex] = useState<CategorySearchIndex>({});
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const preferredLanguage = getStoredLanguage();
      const languages = [
        preferredLanguage,
        ...CATEGORY_SEARCH_LANGUAGES.filter((language) => language !== preferredLanguage),
      ];

      const categoryResponses = await Promise.allSettled(
        languages.map(async (lang) => {
          const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/tree', {
            params: { lang },
          });
          return response.data ?? [];
        }),
      );

      const fulfilledTrees = categoryResponses.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      );
      const preferredResult = categoryResponses[0];
      const preferredTree =
        preferredResult?.status === 'fulfilled' ? preferredResult.value : (fulfilledTrees[0] ?? []);

      setCategories(preferredTree);
      setSearchIndex(buildCategorySearchIndex(fulfilledTrees));
      setHasLoaded(fulfilledTrees.length > 0);
    } catch {
      setCategories([]);
      setSearchIndex({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || hasLoaded) {
      return;
    }
    void fetchCategories();
  }, [fetchCategories, hasLoaded, open]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    const unsubscribeTree = subscribeShopCategoryTreeUpdated(() => {
      void fetchCategories();
    });
    const handleLanguageUpdated = () => {
      void fetchCategories();
    };

    window.addEventListener('language-updated', handleLanguageUpdated);
    return () => {
      unsubscribeTree();
      window.removeEventListener('language-updated', handleLanguageUpdated);
    };
  }, [fetchCategories, hasLoaded]);

  return { categories, searchIndex, loading };
}

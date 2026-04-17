'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import type { Category } from './category-nav-types';

function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  cats.forEach((cat) => {
    result.push(cat);
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children));
    }
  });
  return result;
}

/**
 * Syncs search + category query params into header state. Must be under Suspense (useSearchParams).
 */
export function HeaderSearchSync({
  setSearchQuery,
  setSelectedCategory,
  categories,
}: {
  setSearchQuery: (_query: string) => void;
  setSelectedCategory: (_category: Category | null) => void;
  categories: Category[];
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const searchParam = searchParams.get('search');
    const categoryParam = searchParams.get('category');
    setSearchQuery(searchParam || '');

    if (categoryParam && categories.length > 0) {
      const allCategories = flattenCategories(categories);
      const foundCategory = allCategories.find((cat) => cat.slug === categoryParam);
      setSelectedCategory(foundCategory || null);
    } else {
      setSelectedCategory(null);
    }
  }, [searchParams, categories, setSearchQuery, setSelectedCategory]);

  return null;
}

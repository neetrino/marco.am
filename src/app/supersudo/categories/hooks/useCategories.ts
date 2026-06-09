import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import {
  readAdminCategoriesCache,
  writeAdminCategoriesCache,
} from '@/lib/admin/admin-reference-data-cache';
import type { Category } from '../types';
import type { AdminCategoryView } from '../utils';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  reorderCategoriesOptimistically: (
    categoryId: string,
    targetCategoryId: string,
    scope: AdminCategoryView,
  ) => void;
  setCategoryHeaderVisibilityOptimistically: (categoryId: string, showInHeader: boolean) => void;
}

/**
 * Hook for fetching and managing categories
 */
export function useCategories(): UseCategoriesReturn {
  const cachedCategories = readAdminCategoriesCache<Category>();
  const hadCacheRef = useRef(Boolean(cachedCategories?.length));
  const [categories, setCategories] = useState<Category[]>(cachedCategories ?? []);
  const [loading, setLoading] = useState(!hadCacheRef.current);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      beginAdminDataFetch(hadCacheRef.current, setLoading);
      setError(null);
      logger.debug('Fetching categories');
      const response = await apiClient.get<{ data: Category[] }>('/api/v1/supersudo/categories');
      const nextCategories = response.data || [];
      setCategories(nextCategories);
      writeAdminCategoriesCache(nextCategories);
      hadCacheRef.current = true;
      logger.info('Categories loaded', { count: nextCategories.length });
    } catch (err: unknown) {
      logger.error('Error fetching categories', { error: err });
      if (!hadCacheRef.current) {
        setCategories([]);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderCategoriesOptimistically = useCallback(
    (categoryId: string, targetCategoryId: string, scope: AdminCategoryView) => {
      const isInScope = (category: Category): boolean =>
        scope === 'roots' ? !category.parentId : Boolean(category.parentId);

      let nextSnapshot: Category[] | null = null;
      setCategories((prev) => {
        const scoped = prev.filter(isInScope);
        const sourceIndex = scoped.findIndex((category) => category.id === categoryId);
        const targetIndex = scoped.findIndex((category) => category.id === targetCategoryId);
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
          return prev;
        }

        const reorderedScoped = [...scoped];
        const [movingCategory] = reorderedScoped.splice(sourceIndex, 1);
        reorderedScoped.splice(targetIndex, 0, movingCategory);

        let scopedCursor = 0;
        const next = prev.map((category) =>
          isInScope(category) ? reorderedScoped[scopedCursor++] : category,
        );
        nextSnapshot = next;
        return next;
      });

      if (nextSnapshot) {
        writeAdminCategoriesCache(nextSnapshot);
      }
    },
    [],
  );

  const setCategoryHeaderVisibilityOptimistically = useCallback(
    (categoryId: string, showInHeader: boolean) => {
      let nextSnapshot: Category[] | null = null;
      setCategories((prev) => {
        const next = prev.map((category) =>
          category.id === categoryId ? { ...category, showInHeader } : category,
        );
        nextSnapshot = next;
        return next;
      });

      if (nextSnapshot) {
        writeAdminCategoriesCache(nextSnapshot);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    reorderCategoriesOptimistically,
    setCategoryHeaderVisibilityOptimistically,
  };
}

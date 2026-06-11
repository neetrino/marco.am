import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import {
  readAdminCategoriesCache,
  writeAdminCategoriesCache,
} from '@/lib/admin/admin-reference-data-cache';
import type { LanguageCode } from '@/lib/language';
import type { Category } from '../types';
import type { AdminCategoryView } from '../utils';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  syncCategoriesCache: () => Promise<void>;
  applyOptimisticCategories: (updater: (previous: Category[]) => Category[]) => () => void;
  reorderCategoriesOptimistically: (
    categoryId: string,
    targetCategoryId: string,
    scope: AdminCategoryView,
    parentId?: string | null,
  ) => void;
  setCategoryHeaderVisibilityOptimistically: (categoryId: string, showInHeader: boolean) => void;
}

/**
 * Hook for fetching and managing categories
 */
export function useCategories(language: LanguageCode): UseCategoriesReturn {
  const cachedCategories = readAdminCategoriesCache<Category>(language);
  const hadCacheRef = useRef(Boolean(cachedCategories?.length));
  const cacheWriteTimeoutRef = useRef<number | null>(null);
  const [categories, setCategories] = useState<Category[]>(cachedCategories ?? []);
  const [loading, setLoading] = useState(!hadCacheRef.current);
  const [error, setError] = useState<string | null>(null);

  const writeCategoriesCacheDeferred = useCallback(
    (nextCategories: Category[]) => {
      if (typeof window === 'undefined') {
        writeAdminCategoriesCache(language, nextCategories);
        return;
      }
      if (cacheWriteTimeoutRef.current !== null) {
        window.clearTimeout(cacheWriteTimeoutRef.current);
      }
      cacheWriteTimeoutRef.current = window.setTimeout(() => {
        writeAdminCategoriesCache(language, nextCategories);
        cacheWriteTimeoutRef.current = null;
      }, 0);
    },
    [language],
  );

  const fetchCategories = useCallback(async () => {
    try {
      beginAdminDataFetch(hadCacheRef.current, setLoading);
      setError(null);
      logger.debug('Fetching categories');
      const response = await apiClient.get<{ data: Category[] }>('/api/v1/supersudo/categories', {
        params: { lang: language },
      });
      const nextCategories = response.data || [];
      setCategories(nextCategories);
      writeCategoriesCacheDeferred(nextCategories);
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
  }, [language, writeCategoriesCacheDeferred]);

  const syncCategoriesCache = useCallback(async () => {
    try {
      const response = await apiClient.get<{ data: Category[] }>('/api/v1/supersudo/categories', {
        params: { lang: language },
      });
      const nextCategories = response.data || [];
      writeCategoriesCacheDeferred(nextCategories);
      hadCacheRef.current = true;
    } catch (err: unknown) {
      logger.warn('Category cache sync failed', { error: err });
    }
  }, [language, writeCategoriesCacheDeferred]);

  const applyOptimisticCategories = useCallback(
    (updater: (previous: Category[]) => Category[]) => {
      let previousSnapshot: Category[] = [];
      setCategories((previous) => {
        previousSnapshot = previous;
        const next = updater(previous);
        writeCategoriesCacheDeferred(next);
        return next;
      });

      return () => {
        setCategories(previousSnapshot);
        writeCategoriesCacheDeferred(previousSnapshot);
      };
    },
    [writeCategoriesCacheDeferred],
  );

  const reorderCategoriesOptimistically = useCallback(
    (
      categoryId: string,
      targetCategoryId: string,
      scope: AdminCategoryView,
      parentId: string | null = null,
    ) => {
      let nextSnapshot: Category[] | null = null;
      setCategories((prev) => {
        const reorderWithin = (predicate: (category: Category) => boolean): Category[] | null => {
          const scoped = prev.filter(predicate);
          const sourceIndex = scoped.findIndex((category) => category.id === categoryId);
          const targetIndex = scoped.findIndex((category) => category.id === targetCategoryId);
          if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
            return null;
          }

          const reorderedScoped = [...scoped];
          const [movingCategory] = reorderedScoped.splice(sourceIndex, 1);
          reorderedScoped.splice(targetIndex, 0, movingCategory);

          let scopedCursor = 0;
          return prev.map((category) =>
            predicate(category) ? reorderedScoped[scopedCursor++] : category,
          );
        };

        const rootPredicate = (category: Category) => !category.parentId;
        const siblingPredicate = (category: Category) => category.parentId === parentId;
        const next =
          scope === 'roots'
            ? reorderWithin(rootPredicate)
            : reorderWithin(siblingPredicate);
        if (!next) {
          return prev;
        }
        nextSnapshot = next;
        return next;
      });

      if (nextSnapshot) {
        writeCategoriesCacheDeferred(nextSnapshot);
      }
    },
    [writeCategoriesCacheDeferred],
  );

  const setCategoryHeaderVisibilityOptimistically = useCallback(
    (categoryId: string, showInHeader: boolean) => {
      let nextSnapshot: Category[] | null = null;
      setCategories((prev) => {
        const categoryIndex = prev.findIndex((category) => category.id === categoryId);
        if (categoryIndex < 0) {
          return prev;
        }
        if (Boolean(prev[categoryIndex]?.showInHeader) === showInHeader) {
          return prev;
        }
        const next = [...prev];
        next[categoryIndex] = {
          ...next[categoryIndex],
          showInHeader,
        };
        nextSnapshot = next;
        return next;
      });

      if (nextSnapshot) {
        writeCategoriesCacheDeferred(nextSnapshot);
      }
    },
    [writeCategoriesCacheDeferred],
  );

  useEffect(() => {
    return () => {
      if (cacheWriteTimeoutRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(cacheWriteTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    syncCategoriesCache,
    applyOptimisticCategories,
    reorderCategoriesOptimistically,
    setCategoryHeaderVisibilityOptimistically,
  };
}

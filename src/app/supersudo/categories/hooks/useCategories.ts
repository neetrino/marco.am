import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import {
  readAdminCategoriesCache,
  writeAdminCategoriesCache,
} from '@/lib/admin/admin-reference-data-cache';
import type { Category } from '../types';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
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

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, fetchCategories };
}

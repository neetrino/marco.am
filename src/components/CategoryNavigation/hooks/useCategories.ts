'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../lib/api-client';
import { getStoredLanguage } from '../../../lib/language';
import { subscribeShopCategoryTreeUpdated } from '../../../lib/shop-category-tree-sync';
import { flattenCategories, type Category } from '../utils';

interface CategoriesResponse {
  data: Category[];
}

/**
 * Hook for fetching categories
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const language = getStoredLanguage();
      const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/tree', {
        params: { lang: language },
      });

      const categoriesList = response.data || [];
      const allCategories = flattenCategories(categoriesList);
      setCategories(allCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    return subscribeShopCategoryTreeUpdated(() => {
      void fetchCategories();
    });
  }, [fetchCategories]);

  return { categories, loading };
}





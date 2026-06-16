'use client';

import { useQuery } from '@tanstack/react-query';
import type { LanguageCode } from '../../lib/language';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-keys';
import type { Category, CategoriesResponse } from './category-nav-types';

const MEGA_MENU_STALE_MS = 300_000;

export function useMegaMenuRoots(menuOpen: boolean, lang: LanguageCode) {
  return useQuery({
    queryKey: queryKeys.megaMenuRoots(lang),
    queryFn: async () => {
      const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/mega-menu/roots', {
        params: { lang },
      });
      return response.data ?? [];
    },
    enabled: menuOpen,
    staleTime: MEGA_MENU_STALE_MS,
  });
}

export function useMegaMenuBranch(menuOpen: boolean, slug: string | null, lang: LanguageCode) {
  return useQuery({
    queryKey: queryKeys.megaMenuBranch(slug ?? '', lang),
    queryFn: async () => {
      if (!slug) {
        return null;
      }
      const response = await apiClient.get<{ data: Category }>(
        `/api/v1/categories/mega-menu/${encodeURIComponent(slug)}`,
        { params: { lang } },
      );
      return response.data ?? null;
    },
    enabled: menuOpen && Boolean(slug),
    staleTime: MEGA_MENU_STALE_MS,
  });
}

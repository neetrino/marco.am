import type { QueryClient } from '@tanstack/react-query';

import { apiClient } from '../../lib/api-client';
import type { LanguageCode } from '../../lib/language';
import { queryKeys } from '../../lib/query-keys';
import type { Category, CategoriesResponse } from './category-nav-types';

export const MEGA_MENU_STALE_MS = 300_000;

export async function fetchMegaMenuRoots(lang: LanguageCode): Promise<Category[]> {
  const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/mega-menu/roots', {
    params: { lang },
  });
  return response.data ?? [];
}

export async function fetchMegaMenuBranch(
  slug: string,
  lang: LanguageCode,
): Promise<Category | null> {
  const response = await apiClient.get<{ data: Category }>(
    `/api/v1/categories/mega-menu/${encodeURIComponent(slug)}`,
    { params: { lang } },
  );
  return response.data ?? null;
}

/** Prefetch roots and all root branches so the categories sheet opens instantly. */
export function prefetchMegaMenuCategories(queryClient: QueryClient, lang: LanguageCode): void {
  void (async () => {
    const roots = await queryClient.fetchQuery({
      queryKey: queryKeys.megaMenuRoots(lang),
      queryFn: () => fetchMegaMenuRoots(lang),
      staleTime: MEGA_MENU_STALE_MS,
    });

    await Promise.all(
      roots.map((root) =>
        queryClient.prefetchQuery({
          queryKey: queryKeys.megaMenuBranch(root.slug, lang),
          queryFn: () => fetchMegaMenuBranch(root.slug, lang),
          staleTime: MEGA_MENU_STALE_MS,
        }),
      ),
    );
  })();
}

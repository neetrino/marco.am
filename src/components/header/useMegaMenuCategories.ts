'use client';

import { useQuery } from '@tanstack/react-query';
import type { LanguageCode } from '../../lib/language';
import { queryKeys } from '../../lib/query-keys';
import {
  fetchMegaMenuBranch,
  fetchMegaMenuRoots,
  MEGA_MENU_STALE_MS,
} from './megaMenuQueries';

export function useMegaMenuRoots(menuOpen: boolean, lang: LanguageCode) {
  return useQuery({
    queryKey: queryKeys.megaMenuRoots(lang),
    queryFn: () => fetchMegaMenuRoots(lang),
    enabled: menuOpen,
    staleTime: MEGA_MENU_STALE_MS,
  });
}

export function useMegaMenuBranch(menuOpen: boolean, slug: string | null, lang: LanguageCode) {
  return useQuery({
    queryKey: queryKeys.megaMenuBranch(slug ?? '', lang),
    queryFn: () => {
      if (!slug) {
        return null;
      }
      return fetchMegaMenuBranch(slug, lang);
    },
    enabled: menuOpen && Boolean(slug),
    staleTime: MEGA_MENU_STALE_MS,
  });
}

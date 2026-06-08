import type { QueryClient } from '@tanstack/react-query';
import {
  fetchHomeBrandPartnersClient,
  HOME_BRAND_PARTNERS_QUERY_STALE_MS,
} from '@/lib/home-brand-partners-client';
import type { LanguageCode } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';

const warmInFlight = new Set<string>();

/**
 * Seeds React Query with brand partners before `/brands` navigation so the grid
 * paints from cache instead of a loading skeleton.
 */
export function warmBrandsPageClientCache(
  queryClient: QueryClient,
  language: LanguageCode,
): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (warmInFlight.has(language)) {
    return;
  }
  warmInFlight.add(language);
  void queryClient
    .prefetchQuery({
      queryKey: queryKeys.homeBrandPartners(language),
      queryFn: () => fetchHomeBrandPartnersClient(language),
      staleTime: HOME_BRAND_PARTNERS_QUERY_STALE_MS,
    })
    .finally(() => {
      warmInFlight.delete(language);
    });
}

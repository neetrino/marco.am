import { apiClient } from '@/lib/api-client';
import type { LanguageCode } from '@/lib/language';
import type { HomeBrandPartnersPublicPayload } from '@/lib/types/home-brand-partners-public';

/** Shared client fetch for `GET /api/v1/home/brand-partners` (React Query + idle prefetch). */
export const HOME_BRAND_PARTNERS_QUERY_STALE_MS = 300_000;

export async function fetchHomeBrandPartnersClient(
  locale: LanguageCode,
): Promise<HomeBrandPartnersPublicPayload> {
  return apiClient.get<HomeBrandPartnersPublicPayload>('/api/v1/home/brand-partners', {
    params: { locale },
  });
}

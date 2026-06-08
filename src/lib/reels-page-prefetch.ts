import { apiClient } from '@/lib/api-client';
import { t } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';
import type { ReelsPublicPayload } from '@/lib/schemas/reels-management.schema';
import { writeReelsPageCache } from '@/lib/reels-page-client-cache';

const warmInFlight = new Set<string>();

/**
 * Prefetches the public reels feed before `/reels` navigation so Suspense can
 * paint from session cache instead of an empty fallback.
 */
export function warmReelsPageClientCache(language: LanguageCode): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (warmInFlight.has(language)) {
    return;
  }
  warmInFlight.add(language);

  void apiClient
    .get<ReelsPublicPayload>('/api/v1/reels', { params: { locale: language } })
    .then((payload) => {
      writeReelsPageCache(
        language,
        payload.items,
        t(language, 'home.reels_page.watch_cta'),
      );
    })
    .catch(() => {
      /* Prefetch is best-effort — RSC will fetch on mount if this fails. */
    })
    .finally(() => {
      warmInFlight.delete(language);
    });
}

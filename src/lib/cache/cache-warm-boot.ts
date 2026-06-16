import { bannerManagementService } from '@/lib/services/banner-management.service';
import { categoriesMegaMenuService } from '@/lib/services/categories-mega-menu.service';
import { categoriesService } from '@/lib/services/categories.service';

const WARM_LOCALES = ['en', 'hy', 'ru'] as const;

/**
 * Populates Redis (or in-memory fallback) for hot anonymous paths.
 * Opt-in: set `CACHE_WARM_ON_START=1` on the Node server (e.g. after deploy).
 * Safe: public banner + navigation only; no user/session data.
 *
 * Product listing warm-up is intentionally excluded from instrumentation startup path
 * because its dependency chain can include native image tooling (`sharp`) that is not
 * always available in every Next.js compile context.
 */
export async function warmPublicShopCaches(): Promise<void> {
  await Promise.all([
    ...WARM_LOCALES.map((localeRaw) =>
      bannerManagementService.getPublicHomeHeroSlotsPayload({ localeRaw }),
    ),
    ...WARM_LOCALES.map((lang) => categoriesService.getTree(lang)),
    categoriesMegaMenuService.warmCaches(WARM_LOCALES),
  ]);
}

import type { LanguageCode } from '@/lib/language';
import {
  getCachedPdpDetail,
  getCachedPdpRelated,
} from '@/lib/product-pdp/pdp-server-cache';
import { getProductsPlpReadModelPayload } from '@/lib/read-model/products-plp-read-model';
import { logger } from '@/lib/utils/logger';

const WARM_LOCALES: LanguageCode[] = ['hy', 'en', 'ru'];

/** How many of the most-visible products (default listing, page 1) get their PDP cache primed. */
const PDP_WARM_PRODUCT_LIMIT = 24;

/** Bounded concurrency so boot warm never starves the DB pool for live requests. */
const PDP_WARM_CONCURRENCY = 4;

async function warmSinglePdp(slug: string, lang: LanguageCode): Promise<void> {
  await Promise.allSettled([
    getCachedPdpDetail(slug, lang),
    getCachedPdpRelated(slug, lang),
  ]);
}

async function runWithConcurrency(
  tasks: ReadonlyArray<() => Promise<void>>,
  concurrency: number,
): Promise<number> {
  let failed = 0;
  for (let start = 0; start < tasks.length; start += concurrency) {
    const batch = tasks.slice(start, start + concurrency).map((task) => task());
    const outcomes = await Promise.allSettled(batch);
    failed += outcomes.filter((outcome) => outcome.status === 'rejected').length;
  }
  return failed;
}

/**
 * Primes the PDP detail + related caches for the most-visible products
 * (first page of the default storefront listing), so even their very first
 * open is served warm (~80ms) instead of paying the cold read-model cost.
 *
 * Best-effort: failures are swallowed per task; slugs are locale-stable so they
 * are resolved once from the default (hy) listing and reused across locales.
 */
export async function warmShopPdpCache(): Promise<void> {
  const started = Date.now();
  const listing = await getProductsPlpReadModelPayload({
    page: '1',
    limit: String(PDP_WARM_PRODUCT_LIMIT),
    lang: 'hy',
    includeFilters: '0',
  });

  const slugs = listing.items.map((item) => item.slug).filter(Boolean);
  if (slugs.length === 0) {
    logger.info('[warmShopPdpCache] no products to warm');
    return;
  }

  const tasks = WARM_LOCALES.flatMap((lang) =>
    slugs.map((slug) => () => warmSinglePdp(slug, lang)),
  );

  const failed = await runWithConcurrency(tasks, PDP_WARM_CONCURRENCY);
  logger.info('[warmShopPdpCache] finished', {
    ms: Date.now() - started,
    slugs: slugs.length,
    locales: WARM_LOCALES.length,
    failed,
  });
}

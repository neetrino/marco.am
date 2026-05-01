/**
 * PDP (single product) client + edge cache tuning.
 * Tune here if prices/stock must appear fresher (lower values) or UX prefers fewer requests (higher).
 */

/** React Query: PDP visual/detail treated as fresh — avoids refetch when revisiting the same slug/lang. */
export const PDP_QUERY_STALE_TIME_MS = 30 * 60 * 1000;

/** React Query: inactive PDP queries stay in memory after navigating away (soft navigation back = instant). */
export const PDP_QUERY_GC_TIME_MS = 24 * 60 * 60 * 1000;

/** Related carousel on PDP — aligned with PDP prefetch keys. */
export const PDP_RELATED_STALE_TIME_MS = 30 * 60 * 1000;

/** Related rows garbage-collection when unused. */
export const PDP_RELATED_GC_TIME_MS = 24 * 60 * 60 * 1000;

/** Next.js `unstable_cache` revalidate window for SSR PDP loaders (seconds). */
export const PDP_NEXT_CACHE_REVALIDATE_SECONDS = 30 * 60;

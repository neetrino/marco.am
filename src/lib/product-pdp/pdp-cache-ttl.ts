const SECONDS_PER_DAY = 60 * 60 * 24;

/**
 * Long TTL for PDP read-through caches (SSR + API detail/related).
 * Freshness is guaranteed by explicit invalidation on product change
 * (`invalidateProductReadCaches`), so the TTL only acts as a safety cap.
 */
export const PDP_CACHE_TTL_SEC = SECONDS_PER_DAY;

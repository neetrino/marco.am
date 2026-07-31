/**
 * Per-IP sliding-window limits for public `GET /api/v1/*` traffic (bot/crawler
 * protection). Starting values for the team to tune after observing production.
 *
 * Applied in `src/proxy.ts` via `checkPublicApiGetRateLimit` — excludes cron,
 * supersudo, and paths already covered by stricter POST limiters.
 */
export const PUBLIC_API_RATE_LIMIT_MAX = 120;

/** Sliding window (Upstash `slidingWindow` format). */
export const PUBLIC_API_RATE_LIMIT_WINDOW = "60 s" as const;

/** Upstash Redis key prefix for public API GET limits. */
export const PUBLIC_API_RATELIMIT_PREFIX = "ratelimit:public-api";

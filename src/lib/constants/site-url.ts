import { normalizePublicAppUrl } from '@/lib/config/deployment-env';

/** Canonical production host when `NEXT_PUBLIC_APP_URL` is unset (no trailing slash). */
export const SITE_BASE_URL_FALLBACK = 'https://www.marco.am' as const;

/**
 * Public storefront origin for absolute URLs (robots, sitemap, metadata).
 * Prefers `NEXT_PUBLIC_APP_URL`; falls back to {@link SITE_BASE_URL_FALLBACK}.
 */
export const SITE_BASE_URL =
  normalizePublicAppUrl(process.env.NEXT_PUBLIC_APP_URL) ?? SITE_BASE_URL_FALLBACK;

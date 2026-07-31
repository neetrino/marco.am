/** Read-through cache key for sitemap dynamic slug lists. */
export const SITEMAP_CACHE_KEY = 'sitemap:v1' as const;

/** TTL for cached product/category slug payloads (seconds). */
export const SITEMAP_CACHE_TTL_SECONDS = 3600;

/** ISR revalidate for `src/app/sitemap.ts`. */
export const SITEMAP_REVALIDATE_SECONDS = 3600;

/**
 * Public storefront pages included in the sitemap (path only, leading slash).
 * Excludes auth, account, cart, checkout, admin, and order detail routes.
 */
export const PUBLIC_STATIC_SITEMAP_PATHS = [
  '/',
  '/products',
  '/about',
  '/contact',
  '/brands',
  '/reels',
  '/reels/watch',
  '/faq',
  '/support',
  '/stores',
  '/shipping',
  '/delivery',
  '/delivery-returns',
  '/delivery-return',
  '/delivery-terms',
  '/returns',
  '/installment-terms',
  '/privacy',
  '/terms',
  '/cookies',
  '/refund-policy',
] as const;

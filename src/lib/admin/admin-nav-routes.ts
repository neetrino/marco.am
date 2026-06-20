/** Internal admin panel routes (excludes public home `/`). */
export const ADMIN_PANEL_ROUTES = [
  '/supersudo',
  '/supersudo/hero-banner',
  '/supersudo/orders',
  '/supersudo/products',
  '/supersudo/categories',
  '/supersudo/brands',
  '/supersudo/attributes',
  '/supersudo/promo-codes',
  '/supersudo/quick-settings',
  '/supersudo/users',
  '/supersudo/reels',
  '/supersudo/price-filter-settings',
  '/supersudo/messages',
  '/supersudo/analytics',
  '/supersudo/delivery',
  '/supersudo/settings',
] as const;

/** Warm these first — most frequent admin destinations. */
export const ADMIN_PRIORITY_PREFETCH_ROUTES = [
  '/supersudo',
  '/supersudo/orders',
  '/supersudo/products',
  '/supersudo/settings',
] as const;

/** Builds a stable cache key from an admin API path and query params. */
export function buildAdminListCacheKey(
  endpoint: string,
  params: Record<string, string> = {},
): string {
  const query = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return query ? `${endpoint}?${query}` : endpoint;
}

export const ADMIN_CACHE_KEYS = {
  dashboard: 'dashboard',
  categories: 'list/categories',
  brands: 'list/brands',
  attributes: 'list/attributes',
  settings: 'settings',
  delivery: 'delivery',
  banners: 'banners',
  promoCodes: 'promo-codes',
  priceFilter: 'settings/price-filter',
  reelsAdmin: 'reels-admin',
  stockAnalytics: 'analytics/stock',
  ordersDefault: buildAdminListCacheKey('orders', {
    page: '1',
    limit: '20',
    status: '',
    paymentStatus: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }),
  productsDefault: buildAdminListCacheKey('products', {
    page: '1',
    limit: '20',
    sort: 'createdAt-desc',
  }),
  usersDefault: buildAdminListCacheKey('users', {
    page: '1',
    limit: '20',
    search: '',
    role: '',
  }),
  messagesDefault: buildAdminListCacheKey('messages', {
    page: '1',
    limit: '20',
  }),
  analyticsWeek: buildAdminListCacheKey('analytics', { period: 'week' }),
  analyticsOrderStatus: 'analytics/order-status-breakdown',
} as const;

/** Builds a stable cache key from an admin API path and query params. */
export function buildAdminListCacheKey(
  endpoint: string,
  params: Record<string, string> = {},
): string {
  const query = Object.entries(params)
    .filter(([, value]) => value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return query ? `${endpoint}?${query}` : endpoint;
}

type AdminProductsListCacheInput = {
  page: number;
  limit?: number;
  lang: string;
  search?: string;
  category?: string;
  sku?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  stockFilter?: 'all' | 'inStock' | 'outOfStock';
};

/** Single cache-key builder for admin products list (page + warm). */
export function buildAdminProductsListCacheKey(input: AdminProductsListCacheInput): string {
  const params: Record<string, string> = {
    page: String(input.page),
    limit: String(input.limit ?? 20),
    lang: input.lang,
    search: input.search?.trim() ?? '',
    category: input.category ?? '',
    sku: input.sku?.trim() ?? '',
    minPrice: input.minPrice?.trim() ?? '',
    maxPrice: input.maxPrice?.trim() ?? '',
    sort: input.sort?.startsWith('createdAt') ? input.sort : '',
  };
  if (input.stockFilter && input.stockFilter !== 'all') {
    params.stockFilter = input.stockFilter;
  }
  return buildAdminListCacheKey('products', params);
}

export function buildProductsDefaultListCacheKey(lang: string): string {
  return buildAdminProductsListCacheKey({
    page: 1,
    lang,
    sort: 'createdAt-desc',
  });
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

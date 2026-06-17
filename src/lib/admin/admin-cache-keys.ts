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

type AdminOrdersListCacheInput = {
  page: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
};

/** Query params for admin orders list (page + warm) — omits empty filters. */
export function buildAdminOrdersListApiParams(
  input: AdminOrdersListCacheInput,
): Record<string, string> {
  const params: Record<string, string> = {
    page: String(input.page),
    limit: String(input.limit ?? 20),
    sortBy: input.sortBy || 'createdAt',
    sortOrder: input.sortOrder || 'desc',
  };
  const status = input.status?.trim();
  const paymentStatus = input.paymentStatus?.trim();
  const search = input.search?.trim();
  if (status) {
    params.status = status;
  }
  if (paymentStatus) {
    params.paymentStatus = paymentStatus;
  }
  if (search) {
    params.search = search;
  }
  return params;
}

/** Single cache-key builder for admin orders list (page + warm). */
export function buildAdminOrdersListCacheKey(input: AdminOrdersListCacheInput): string {
  return buildAdminListCacheKey('orders', buildAdminOrdersListApiParams(input));
}

export function buildOrdersDefaultListCacheKey(): string {
  return buildAdminOrdersListCacheKey({
    page: 1,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
}

export function buildAdminOrderDetailCacheKey(orderId: string): string {
  return `orders/detail/${orderId}`;
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

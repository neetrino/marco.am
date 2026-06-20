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
  published?: string;
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
    published: input.published ?? '',
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

type AdminUsersListCacheInput = {
  page: number;
  limit?: number;
  search?: string;
  role?: string;
};

export function buildAdminUsersListApiParams(
  input: AdminUsersListCacheInput,
): Record<string, string> {
  const params: Record<string, string> = {
    page: String(input.page),
    limit: String(input.limit ?? 20),
  };
  const search = input.search?.trim();
  const role = input.role?.trim();
  if (search) {
    params.search = search;
  }
  if (role) {
    params.role = role;
  }
  return params;
}

export function buildAdminUsersListCacheKey(input: AdminUsersListCacheInput): string {
  return buildAdminListCacheKey('users', buildAdminUsersListApiParams(input));
}

export function buildUsersDefaultListCacheKey(): string {
  return buildAdminUsersListCacheKey({ page: 1 });
}

type AdminMessagesListCacheInput = {
  page: number;
  limit?: number;
};

export function buildAdminMessagesListApiParams(
  input: AdminMessagesListCacheInput,
): Record<string, string> {
  return {
    page: String(input.page),
    limit: String(input.limit ?? 20),
  };
}

export function buildAdminMessagesListCacheKey(input: AdminMessagesListCacheInput): string {
  return buildAdminListCacheKey('messages', buildAdminMessagesListApiParams(input));
}

export function buildMessagesDefaultListCacheKey(): string {
  return buildAdminMessagesListCacheKey({ page: 1 });
}

export function buildAdminOrderDetailCacheKey(orderId: string): string {
  return `orders/detail/${orderId}`;
}

export function buildProductDiscountsCacheKey(lang: string): string {
  return buildAdminListCacheKey('products/discounts', { lang });
}

export function buildAdminBootstrapCacheKey(
  paths: readonly string[],
  lang: string,
): string {
  return buildAdminListCacheKey('bootstrap', {
    paths: [...paths].sort().join(','),
    lang,
  });
}

type AnalyticsCacheInput = {
  period: string;
  startDate?: string;
  endDate?: string;
};

export function buildAnalyticsCacheKey(input: AnalyticsCacheInput): string {
  return buildAdminListCacheKey('analytics', {
    period: input.period,
    startDate: input.period === 'custom' ? input.startDate ?? '' : '',
    endDate: input.period === 'custom' ? input.endDate ?? '' : '',
  });
}

export function buildAnalyticsRequestParams(input: AnalyticsCacheInput): Record<string, string> {
  const params: Record<string, string> = { period: input.period };
  if (input.period === 'custom' && input.startDate && input.endDate) {
    params.startDate = input.startDate;
    params.endDate = input.endDate;
  }
  return params;
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
  usersDefault: buildUsersDefaultListCacheKey(),
  messagesDefault: buildMessagesDefaultListCacheKey(),
  analyticsWeek: buildAdminListCacheKey('analytics', { period: 'week' }),
  analyticsMonth: buildAdminListCacheKey('analytics', { period: 'month' }),
  analyticsOrderStatus: 'analytics/order-status-breakdown',
} as const;

export function buildAdminCategoriesCacheKey(
  language: string,
  options?: { includeCounts?: boolean },
): string {
  const includeCounts = options?.includeCounts !== false;
  return includeCounts
    ? `${ADMIN_CACHE_KEYS.categories}:${language}:counts`
    : `${ADMIN_CACHE_KEYS.categories}:${language}:lite`;
}

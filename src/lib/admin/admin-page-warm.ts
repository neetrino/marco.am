import { apiClient } from '@/lib/api-client';
import {
  ADMIN_CACHE_KEYS,
  buildAdminListCacheKey,
  buildAdminOrdersListApiParams,
  buildAdminMessagesListApiParams,
  buildAdminUsersListApiParams,
  buildMessagesDefaultListCacheKey,
  buildOrdersDefaultListCacheKey,
  buildProductDiscountsCacheKey,
  buildProductsDefaultListCacheKey,
  buildUsersDefaultListCacheKey,
} from '@/lib/admin/admin-cache-keys';
import { fetchAdminQuickSettingsBootstrap } from '@/lib/admin/admin-bootstrap-client';
import { warmAdminDashboardCache } from '@/lib/admin/admin-dashboard-client-cache';
import {
  warmAdminCategoriesCache,
  warmAdminCategoriesWithCountsCache,
  warmAdminReferenceDataCaches,
} from '@/lib/admin/admin-reference-data-cache';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';
import { STOCK_ANALYTICS_PAGE_LIMIT } from '@/lib/constants/stock-analytics-ui';
import { getStoredLanguage } from '@/lib/language';

function warmIfMissing<T>(key: string, fetcher: () => Promise<T>): void {
  if (readAdminSessionCache<T>(key, ADMIN_SESSION_CACHE_TTL_MS)) {
    return;
  }
  void fetcher().then((payload) => {
    writeAdminSessionCache(key, payload);
  });
}

function warmOrdersCache(): void {
  const cacheKey = buildOrdersDefaultListCacheKey();
  warmIfMissing(cacheKey, () =>
    dedupedAdminRequest(cacheKey, () =>
      apiClient.get('/api/v1/supersudo/orders', {
        params: buildAdminOrdersListApiParams({
          page: 1,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      }),
    ),
  );
}

function warmProductsCache(language: string): void {
  const cacheKey = buildProductsDefaultListCacheKey(language);
  warmIfMissing(cacheKey, () =>
    dedupedAdminRequest(cacheKey, () =>
      apiClient.get('/api/v1/supersudo/products', {
        params: { page: '1', limit: '20', lang: language, sort: 'createdAt-desc' },
      }),
    ),
  );
}

function warmUsersCache(): void {
  const cacheKey = buildUsersDefaultListCacheKey();
  warmIfMissing(cacheKey, () =>
    dedupedAdminRequest(cacheKey, () =>
      apiClient.get('/api/v1/supersudo/users', {
        params: buildAdminUsersListApiParams({ page: 1 }),
      }),
    ),
  );
}

function warmMessagesCache(): void {
  const cacheKey = buildMessagesDefaultListCacheKey();
  warmIfMissing(cacheKey, () =>
    dedupedAdminRequest(cacheKey, () =>
      apiClient.get('/api/v1/supersudo/messages', {
        params: buildAdminMessagesListApiParams({ page: 1 }),
      }),
    ),
  );
}

function warmAttributesCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.attributes, () =>
    dedupedAdminRequest(ADMIN_CACHE_KEYS.attributes, () =>
      apiClient.get('/api/v1/supersudo/attributes'),
    ),
  );
}

function warmSettingsCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.settings, () =>
    dedupedAdminRequest(ADMIN_CACHE_KEYS.settings, () =>
      apiClient.get('/api/v1/supersudo/settings'),
    ),
  );
}

function warmQuickSettingsCache(language: string): void {
  const settingsCached = readAdminSessionCache<unknown>(
    ADMIN_CACHE_KEYS.settings,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const productsCached = readAdminSessionCache<unknown>(
    buildProductDiscountsCacheKey(language),
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const categoriesCached = readAdminSessionCache<unknown[]>(
    `${ADMIN_CACHE_KEYS.categories}:${language}:lite`,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const brandsCached = readAdminSessionCache<unknown[]>(
    ADMIN_CACHE_KEYS.brands,
    ADMIN_SESSION_CACHE_TTL_MS,
  );

  if (
    settingsCached !== null &&
    productsCached !== null &&
    categoriesCached !== null &&
    brandsCached !== null
  ) {
    return;
  }

  void fetchAdminQuickSettingsBootstrap(language as 'en' | 'hy' | 'ru');
}

function warmDeliveryCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.delivery, () =>
    dedupedAdminRequest(ADMIN_CACHE_KEYS.delivery, () =>
      apiClient.get('/api/v1/supersudo/delivery'),
    ),
  );
}

function warmBannersCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.banners, () =>
    dedupedAdminRequest(ADMIN_CACHE_KEYS.banners, () =>
      apiClient.get('/api/v1/supersudo/banners'),
    ),
  );
}

function warmPromoCodesCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.promoCodes, () =>
    dedupedAdminRequest(ADMIN_CACHE_KEYS.promoCodes, () =>
      apiClient.get('/api/v1/supersudo/promo-codes'),
    ),
  );
}

function warmPriceFilterCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.priceFilter, () =>
    dedupedAdminRequest(ADMIN_CACHE_KEYS.priceFilter, () =>
      apiClient.get('/api/v1/supersudo/settings/price-filter'),
    ),
  );
}

function warmAnalyticsCache(language: string): void {
  warmIfMissing(ADMIN_CACHE_KEYS.analyticsWeek, () =>
    dedupedAdminRequest(ADMIN_CACHE_KEYS.analyticsWeek, () =>
      apiClient.get('/api/v1/supersudo/analytics', { params: { period: 'week' } }),
    ),
  );
  warmIfMissing(ADMIN_CACHE_KEYS.analyticsMonth, () =>
    dedupedAdminRequest(ADMIN_CACHE_KEYS.analyticsMonth, () =>
      apiClient.get('/api/v1/supersudo/analytics', { params: { period: 'month' } }),
    ),
  );
  warmIfMissing(ADMIN_CACHE_KEYS.analyticsOrderStatus, () =>
    dedupedAdminRequest(ADMIN_CACHE_KEYS.analyticsOrderStatus, () =>
      apiClient.get('/api/v1/supersudo/analytics/order-status-breakdown'),
    ),
  );
  const stockCacheKey = buildAdminListCacheKey('analytics/stock', {
    locale: language,
    limit: String(STOCK_ANALYTICS_PAGE_LIMIT),
  });
  warmIfMissing(stockCacheKey, () =>
    dedupedAdminRequest(stockCacheKey, () =>
      apiClient.get('/api/v1/supersudo/analytics/stock', {
        params: { locale: language, limit: String(STOCK_ANALYTICS_PAGE_LIMIT) },
      }),
    ),
  );
}

function warmReelsAdminCache(): void {
  const cacheKey = ADMIN_CACHE_KEYS.reelsAdmin;
  warmIfMissing(cacheKey, () =>
    dedupedAdminRequest(cacheKey, async () => {
      const [reelsStorage, likes, views] = await Promise.all([
        apiClient.get<{ version: number; items: unknown[] }>('/api/v1/supersudo/reels'),
        apiClient.get<{ likesByReelId: Record<string, number> }>('/api/v1/supersudo/reels/likes'),
        apiClient.get<{ viewsByReelId: Record<string, number> }>('/api/v1/supersudo/reels/views'),
      ]);
      return {
        reelsStorage,
        likesByReelId: likes.likesByReelId,
        viewsByReelId: views.viewsByReelId,
      };
    }),
  );
}

/** Warms API cache for a specific admin route (hover / pointer down). */
export function warmAdminPageCacheForPath(path: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const language = getStoredLanguage();
  switch (path) {
    case '/supersudo':
      warmAdminDashboardCache();
      return;
    case '/supersudo/orders':
      warmOrdersCache();
      return;
    case '/supersudo/products':
      warmProductsCache(language);
      warmAdminCategoriesCache(language);
      return;
    case '/supersudo/users':
      warmUsersCache();
      return;
    case '/supersudo/messages':
      warmMessagesCache();
      return;
    case '/supersudo/attributes':
      warmAttributesCache();
      return;
    case '/supersudo/settings':
      warmSettingsCache();
      return;
    case '/supersudo/discounts':
      warmQuickSettingsCache(language);
      return;
    case '/supersudo/delivery':
      warmDeliveryCache();
      return;
    case '/supersudo/hero-banner':
      warmBannersCache();
      return;
    case '/supersudo/promo-codes':
      warmPromoCodesCache();
      return;
    case '/supersudo/price-filter-settings':
      warmPriceFilterCache();
      return;
    case '/supersudo/analytics':
      warmAnalyticsCache(language);
      return;
    case '/supersudo/reels':
      warmReelsAdminCache();
      return;
    case '/supersudo/categories':
      warmAdminCategoriesWithCountsCache(language);
      return;
    case '/supersudo/brands':
      warmAdminReferenceDataCaches(language);
      return;
    default:
      return;
  }
}

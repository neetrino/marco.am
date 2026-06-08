import { apiClient } from '@/lib/api-client';
import { ADMIN_CACHE_KEYS } from '@/lib/admin/admin-cache-keys';
import { warmAdminDashboardCache } from '@/lib/admin/admin-dashboard-client-cache';
import { warmAdminReferenceDataCaches } from '@/lib/admin/admin-reference-data-cache';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';

const warmAllInFlight = { current: false };

function warmIfMissing<T>(key: string, fetcher: () => Promise<T>): void {
  if (readAdminSessionCache<T>(key, ADMIN_SESSION_CACHE_TTL_MS)) {
    return;
  }
  void fetcher().then((payload) => {
    writeAdminSessionCache(key, payload);
  });
}

function warmOrdersCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.ordersDefault, () =>
    apiClient.get('/api/v1/supersudo/orders', {
      params: {
        page: '1',
        limit: '20',
        status: '',
        paymentStatus: '',
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    }),
  );
}

function warmProductsCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.productsDefault, () =>
    apiClient.get('/api/v1/supersudo/products', {
      params: { page: '1', limit: '20', sort: 'createdAt-desc' },
    }),
  );
}

function warmUsersCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.usersDefault, () =>
    apiClient.get('/api/v1/supersudo/users', {
      params: { page: '1', limit: '20', search: '', role: '' },
    }),
  );
}

function warmMessagesCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.messagesDefault, () =>
    apiClient.get('/api/v1/supersudo/messages', {
      params: { page: '1', limit: '20' },
    }),
  );
}

function warmAttributesCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.attributes, () => apiClient.get('/api/v1/supersudo/attributes'));
}

function warmSettingsCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.settings, () => apiClient.get('/api/v1/supersudo/settings'));
}

function warmDeliveryCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.delivery, () => apiClient.get('/api/v1/supersudo/delivery'));
}

function warmBannersCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.banners, () => apiClient.get('/api/v1/supersudo/banners'));
}

function warmPromoCodesCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.promoCodes, () =>
    apiClient.get('/api/v1/supersudo/promo-codes'),
  );
}

function warmPriceFilterCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.priceFilter, () =>
    apiClient.get('/api/v1/supersudo/settings/price-filter'),
  );
}

function warmAnalyticsCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.analyticsWeek, () =>
    apiClient.get('/api/v1/supersudo/analytics', { params: { period: 'week' } }),
  );
  warmIfMissing(ADMIN_CACHE_KEYS.analyticsOrderStatus, () =>
    apiClient.get('/api/v1/supersudo/analytics/order-status-breakdown'),
  );
  warmIfMissing(ADMIN_CACHE_KEYS.stockAnalytics, () =>
    apiClient.get('/api/v1/supersudo/analytics/stock'),
  );
}

function warmReelsAdminCache(): void {
  warmIfMissing(ADMIN_CACHE_KEYS.reelsAdmin, async () => {
    const [reelsStorage, likes, views] = await Promise.all([
      apiClient.get('/api/v1/supersudo/reels'),
      apiClient.get('/api/v1/supersudo/reels/likes'),
      apiClient.get('/api/v1/supersudo/reels/views'),
    ]);
    return { reelsStorage, likes, views };
  });
}

/** Warms API cache for a specific admin route (hover / pointer down). */
export function warmAdminPageCacheForPath(path: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  switch (path) {
    case '/supersudo':
      warmAdminDashboardCache();
      return;
    case '/supersudo/orders':
      warmOrdersCache();
      return;
    case '/supersudo/products':
      warmProductsCache();
      warmAdminReferenceDataCaches();
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
    case '/supersudo/quick-settings':
      warmSettingsCache();
      warmAdminReferenceDataCaches();
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
      warmAnalyticsCache();
      return;
    case '/supersudo/reels':
      warmReelsAdminCache();
      return;
    case '/supersudo/categories':
    case '/supersudo/brands':
      warmAdminReferenceDataCaches();
      return;
    default:
      return;
  }
}

/** Warms default admin list/settings payloads so pages paint instantly on first click. */
export function warmAdminPageCaches(): void {
  if (typeof window === 'undefined' || warmAllInFlight.current) {
    return;
  }
  warmAllInFlight.current = true;

  warmAdminDashboardCache();
  warmAdminReferenceDataCaches();
  warmOrdersCache();
  warmProductsCache();
  warmUsersCache();
  warmMessagesCache();
  warmAttributesCache();
  warmSettingsCache();
  warmDeliveryCache();
  warmBannersCache();
  warmPromoCodesCache();
  warmPriceFilterCache();
  warmAnalyticsCache();
  warmReelsAdminCache();

  globalThis.setTimeout(() => {
    warmAllInFlight.current = false;
  }, 500);
}

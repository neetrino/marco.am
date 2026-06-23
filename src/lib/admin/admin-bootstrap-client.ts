import { apiClient } from '@/lib/api-client';
import {
  ADMIN_CACHE_KEYS,
  buildAdminBootstrapCacheKey,
  buildProductDiscountsCacheKey,
} from '@/lib/admin/admin-cache-keys';
import {
  type AdminDashboardCachePayload,
  type AdminDashboardRecentOrder,
  type AdminDashboardStats,
  type AdminDashboardTopProduct,
  type AdminDashboardUserActivity,
  writeAdminDashboardCache,
} from '@/lib/admin/admin-dashboard-client-cache';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  writeAdminBrandsCache,
  writeAdminCategoriesCache,
} from '@/lib/admin/admin-reference-data-cache';
import { writeAdminSessionCache } from '@/lib/admin/admin-session-cache';
import type { LanguageCode } from '@/lib/language';
import type {
  AdminBootstrapPath,
  AdminBootstrapResponse,
  AdminDashboardBootstrapPayload,
  AdminDiscountsBootstrapPayload,
} from '@/lib/services/admin/admin-bootstrap.service';

type DiscountsSettingsPayload = AdminDiscountsBootstrapPayload['settings'];

let dashboardBootstrapPromise: Promise<AdminDashboardCachePayload> | null = null;
const discountsBootstrapPromises = new Map<string, Promise<AdminDiscountsBootstrapPayload>>();

function dashboardPayloadFromBootstrap(
  bootstrap: AdminDashboardBootstrapPayload,
): AdminDashboardCachePayload {
  return {
    stats: (bootstrap.stats ?? null) as AdminDashboardStats | null,
    recentOrders: (bootstrap.recentOrders.data ?? []) as AdminDashboardRecentOrder[],
    topProducts: (bootstrap.topProducts.data ?? []) as AdminDashboardTopProduct[],
    userActivity: (bootstrap.userActivity.data ?? null) as AdminDashboardUserActivity | null,
  };
}

export function applyDashboardBootstrapToSessionCache(
  bootstrap: AdminDashboardBootstrapPayload,
): AdminDashboardCachePayload {
  const payload = dashboardPayloadFromBootstrap(bootstrap);
  writeAdminDashboardCache(payload);
  return payload;
}

export function applyDiscountsBootstrapToSessionCache(
  bootstrap: AdminDiscountsBootstrapPayload,
  locale: LanguageCode,
): void {
  writeAdminSessionCache(ADMIN_CACHE_KEYS.settings, bootstrap.settings);
  writeAdminCategoriesCache(locale, bootstrap.categories.data ?? [], { includeCounts: false });
  writeAdminBrandsCache(bootstrap.brands.data ?? []);
  writeAdminSessionCache(buildProductDiscountsCacheKey(locale), bootstrap.productDiscounts);
}

async function fetchAdminBootstrapResponse(
  paths: AdminBootstrapPath[],
  locale: LanguageCode,
): Promise<AdminBootstrapResponse> {
  const cacheKey = buildAdminBootstrapCacheKey(paths, locale);
  return dedupedAdminRequest(cacheKey, () =>
    apiClient.get<AdminBootstrapResponse>('/api/v1/supersudo/bootstrap', {
      params: {
        paths: paths.join(','),
        lang: locale,
      },
    }),
  );
}

/** Single HTTP bootstrap for dashboard cold load (replaces 4 parallel API calls). */
export function fetchAdminDashboardBootstrap(): Promise<AdminDashboardCachePayload> {
  if (dashboardBootstrapPromise) {
    return dashboardBootstrapPromise;
  }

  dashboardBootstrapPromise = fetchAdminBootstrapResponse(['dashboard'], 'en')
    .then((response) => {
      if (!response.dashboard) {
        throw new Error('Admin bootstrap missing dashboard payload');
      }
      return applyDashboardBootstrapToSessionCache(response.dashboard);
    })
    .finally(() => {
      dashboardBootstrapPromise = null;
    });

  return dashboardBootstrapPromise;
}

/** Single HTTP bootstrap for discounts page cold load (replaces 4 parallel API calls). */
export function fetchAdminDiscountsBootstrap(
  locale: LanguageCode,
): Promise<AdminDiscountsBootstrapPayload> {
  const existing = discountsBootstrapPromises.get(locale);
  if (existing) {
    return existing;
  }

  const promise = fetchAdminBootstrapResponse(['discounts'], locale)
    .then((response) => {
      if (!response.discounts) {
        throw new Error('Admin bootstrap missing discounts payload');
      }
      applyDiscountsBootstrapToSessionCache(response.discounts, locale);
      return response.discounts;
    })
    .finally(() => {
      discountsBootstrapPromises.delete(locale);
    });

  discountsBootstrapPromises.set(locale, promise);
  return promise;
}

export type DiscountsBootstrapResult = {
  settings: DiscountsSettingsPayload;
  categories: Array<{ id: string; title: string; parentId: string | null }>;
  brands: Array<{ id: string; name: string; logoUrl?: string }>;
  products: Array<{
    id: string;
    title: string;
    image?: string | null;
    price?: number;
    discountPercent?: number;
    discountExpiresAt?: string | null;
  }>;
};

export function mapDiscountsBootstrap(
  bootstrap: AdminDiscountsBootstrapPayload,
): DiscountsBootstrapResult {
  return {
    settings: bootstrap.settings,
    categories: bootstrap.categories.data ?? [],
    brands: (bootstrap.brands.data ?? []).map((brand) => ({
      id: brand.id,
      name: brand.name,
      logoUrl: brand.logoUrl ?? undefined,
    })),
    products: bootstrap.productDiscounts.data ?? [],
  };
}

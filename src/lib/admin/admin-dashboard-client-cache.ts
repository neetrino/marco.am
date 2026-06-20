import { fetchAdminDashboardBootstrap } from '@/lib/admin/admin-bootstrap-client';
import { ADMIN_CACHE_KEYS } from '@/lib/admin/admin-cache-keys';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';

export type AdminDashboardStats = {
  users: { total: number };
  products: { total: number; lowStock: number };
  orders: { total: number; recent: number; pending: number };
  revenue: { total: number; currency: string };
  salesWidgets: {
    todaySales: {
      revenue: number;
      paidOrders: number;
      currency: string;
    };
    monthlySales: {
      revenue: number;
      paidOrders: number;
      currency: string;
    };
    topProduct: {
      productId: string;
      title: string;
      totalQuantity: number;
      totalRevenue: number;
      currency: string;
    } | null;
  };
};

export type AdminDashboardRecentOrder = {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  itemsCount: number;
  createdAt: string;
};

export type AdminDashboardTopProduct = {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  image?: string | null;
};

export type AdminDashboardUserActivity = {
  recentRegistrations: Array<{
    id: string;
    email?: string;
    phone?: string;
    name: string;
    registeredAt: string;
    lastLoginAt?: string;
  }>;
  activeUsers: Array<{
    id: string;
    email?: string;
    phone?: string;
    name: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: string;
    lastLoginAt?: string;
  }>;
};

type AdminDashboardCachePayload = {
  stats: AdminDashboardStats | null;
  recentOrders: AdminDashboardRecentOrder[];
  topProducts: AdminDashboardTopProduct[];
  userActivity: AdminDashboardUserActivity | null;
};

export type { AdminDashboardCachePayload };

let dashboardLoadPromise: Promise<AdminDashboardCachePayload> | null = null;

export function readAdminDashboardCache(): AdminDashboardCachePayload | null {
  return readAdminSessionCache<AdminDashboardCachePayload>(
    ADMIN_CACHE_KEYS.dashboard,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
}

export function writeAdminDashboardCache(payload: AdminDashboardCachePayload): void {
  writeAdminSessionCache(ADMIN_CACHE_KEYS.dashboard, payload);
}

function fetchDashboardPayload(): Promise<AdminDashboardCachePayload> {
  return fetchAdminDashboardBootstrap();
}

/** Single deduped dashboard fetch shared by warm + dashboard page. */
export function loadAdminDashboardPayload(): Promise<AdminDashboardCachePayload> {
  const cached = readAdminDashboardCache();
  if (cached) {
    return Promise.resolve(cached);
  }
  if (dashboardLoadPromise) {
    return dashboardLoadPromise;
  }

  dashboardLoadPromise = fetchDashboardPayload().finally(() => {
      dashboardLoadPromise = null;
    });

  return dashboardLoadPromise;
}

/** Fetches dashboard APIs and stores session cache for instant paint on revisit. */
export function warmAdminDashboardCache(): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (readAdminDashboardCache()) {
    return;
  }
  void loadAdminDashboardPayload();
}

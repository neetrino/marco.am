/**
 * Hook for admin dashboard data fetching
 */

import { useState, useEffect } from 'react';
import {
  loadAdminDashboardPayload,
  readAdminDashboardCache,
  type AdminDashboardRecentOrder,
  type AdminDashboardStats,
  type AdminDashboardTopProduct,
  type AdminDashboardUserActivity,
} from '@/lib/admin/admin-dashboard-client-cache';
import { logger } from '@/lib/utils/logger';

interface UseAdminDashboardProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

function hydrateFromCache() {
  return readAdminDashboardCache();
}

function applyPayload(
  payload: Awaited<ReturnType<typeof loadAdminDashboardPayload>>,
  setters: {
    setStats: (value: AdminDashboardStats | null) => void;
    setRecentOrders: (value: AdminDashboardRecentOrder[]) => void;
    setTopProducts: (value: AdminDashboardTopProduct[]) => void;
    setUserActivity: (value: AdminDashboardUserActivity | null) => void;
  },
): void {
  setters.setStats(payload.stats);
  setters.setRecentOrders(payload.recentOrders);
  setters.setTopProducts(payload.topProducts);
  setters.setUserActivity(payload.userActivity);
}

export function useAdminDashboard({ isLoggedIn, isAdmin }: UseAdminDashboardProps) {
  const initialCache = hydrateFromCache();
  const hadCache = Boolean(initialCache?.stats);

  const [stats, setStats] = useState<AdminDashboardStats | null>(initialCache?.stats ?? null);
  const [recentOrders, setRecentOrders] = useState<AdminDashboardRecentOrder[]>(
    initialCache?.recentOrders ?? [],
  );
  const [topProducts, setTopProducts] = useState<AdminDashboardTopProduct[]>(
    initialCache?.topProducts ?? [],
  );
  const [userActivity, setUserActivity] = useState<AdminDashboardUserActivity | null>(
    initialCache?.userActivity ?? null,
  );
  const [loading, setLoading] = useState(!hadCache);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      return;
    }

    let cancelled = false;
    const cached = readAdminDashboardCache();
    if (!cached?.stats) {
      setLoading(true);
    }

    logger.devLog('📊 [ADMIN] Loading dashboard payload (deduped)...');

    void loadAdminDashboardPayload()
      .then((payload) => {
        if (cancelled) {
          return;
        }
        applyPayload(payload, {
          setStats,
          setRecentOrders,
          setTopProducts,
          setUserActivity,
        });
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isLoggedIn]);

  return {
    stats,
    recentOrders,
    topProducts,
    userActivity,
    statsLoading: loading && !stats,
    recentOrdersLoading: loading && recentOrders.length === 0,
    topProductsLoading: loading && topProducts.length === 0,
    userActivityLoading: loading && !userActivity,
  };
}

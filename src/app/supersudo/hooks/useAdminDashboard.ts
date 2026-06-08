/**
 * Hook for admin dashboard data fetching
 */

import { useState, useEffect } from 'react';
import {
  loadAdminDashboardPayload,
  readAdminDashboardCache,
  type AdminDashboardActivityItem,
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
    setActivity: (value: AdminDashboardActivityItem[]) => void;
    setRecentOrders: (value: AdminDashboardRecentOrder[]) => void;
    setTopProducts: (value: AdminDashboardTopProduct[]) => void;
    setUserActivity: (value: AdminDashboardUserActivity | null) => void;
  },
): void {
  setters.setStats(payload.stats);
  setters.setActivity(payload.activity);
  setters.setRecentOrders(payload.recentOrders);
  setters.setTopProducts(payload.topProducts);
  setters.setUserActivity(payload.userActivity);
}

export function useAdminDashboard({ isLoggedIn, isAdmin }: UseAdminDashboardProps) {
  const initialCache = hydrateFromCache();

  const [stats, setStats] = useState<AdminDashboardStats | null>(initialCache?.stats ?? null);
  const [activity, setActivity] = useState<AdminDashboardActivityItem[]>(initialCache?.activity ?? []);
  const [recentOrders, setRecentOrders] = useState<AdminDashboardRecentOrder[]>(
    initialCache?.recentOrders ?? [],
  );
  const [topProducts, setTopProducts] = useState<AdminDashboardTopProduct[]>(
    initialCache?.topProducts ?? [],
  );
  const [userActivity, setUserActivity] = useState<AdminDashboardUserActivity | null>(
    initialCache?.userActivity ?? null,
  );

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      return;
    }

    let cancelled = false;
    logger.devLog('📊 [ADMIN] Loading dashboard payload (deduped)...');

    void loadAdminDashboardPayload().then((payload) => {
      if (cancelled) {
        return;
      }
      applyPayload(payload, {
        setStats,
        setActivity,
        setRecentOrders,
        setTopProducts,
        setUserActivity,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isLoggedIn]);

  return {
    stats,
    activity,
    recentOrders,
    topProducts,
    userActivity,
    statsLoading: false,
    activityLoading: false,
    recentOrdersLoading: false,
    topProductsLoading: false,
    userActivityLoading: false,
  };
}

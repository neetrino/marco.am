import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { useTranslation } from '../../../../lib/i18n-client';
import { ADMIN_CACHE_KEYS, buildAdminListCacheKey } from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';
import type { AnalyticsData, AdminStatsSummary, OrderStatusBreakdownData } from '../types';

interface UseAnalyticsParams {
  period: string;
  startDate: string;
  endDate: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

interface UseAnalyticsReturn {
  analytics: AnalyticsData | null;
  orderStatusBreakdown: OrderStatusBreakdownData | null;
  /** True when the main analytics call succeeded but order-status-breakdown failed. */
  orderStatusBreakdownFailed: boolean;
  totalUsers: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching analytics data
 */
export function useAnalytics({
  period,
  startDate,
  endDate,
  isLoggedIn,
  isAdmin,
}: UseAnalyticsParams): UseAnalyticsReturn {
  const { t } = useTranslation();
  const cachedAnalytics = readAdminSessionCache<AnalyticsData>(
    ADMIN_CACHE_KEYS.analyticsWeek,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const cachedBreakdown = readAdminSessionCache<OrderStatusBreakdownData>(
    ADMIN_CACHE_KEYS.analyticsOrderStatus,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const hadCacheRef = useRef(Boolean(cachedAnalytics));
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(cachedAnalytics);
  const [orderStatusBreakdown, setOrderStatusBreakdown] =
    useState<OrderStatusBreakdownData | null>(cachedBreakdown);
  const [orderStatusBreakdownFailed, setOrderStatusBreakdownFailed] =
    useState(false);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(!hadCacheRef.current);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      return;
    }

    const fetchAnalytics = async () => {
      const analyticsCacheKey = buildAdminListCacheKey('analytics', {
        period,
        startDate: period === 'custom' ? startDate : '',
        endDate: period === 'custom' ? endDate : '',
      });
      const cachedForPeriod = readAdminSessionCache<AnalyticsData>(
        analyticsCacheKey,
        ADMIN_SESSION_CACHE_TTL_MS,
      );
      try {
        beginAdminDataFetch(Boolean(cachedForPeriod), setLoading);
        if (cachedForPeriod) {
          setAnalytics(cachedForPeriod);
        }
        setError(null);
        setOrderStatusBreakdownFailed(false);
        const params: Record<string, string> = {
          period,
        };
        
        if (period === 'custom' && startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
        }

        const [analyticsResult, breakdownResult] = await Promise.allSettled([
          apiClient.get<AnalyticsData>('/api/v1/supersudo/analytics', {
            params,
          }),
          apiClient.get<OrderStatusBreakdownData>(
            '/api/v1/supersudo/analytics/order-status-breakdown'
          ),
        ]);

        if (analyticsResult.status === 'fulfilled') {
          logger.info('Analytics data loaded', { period, hasData: !!analyticsResult.value });
          setAnalytics(analyticsResult.value);
          writeAdminSessionCache(analyticsCacheKey, analyticsResult.value);
          hadCacheRef.current = true;
        } else {
          throw analyticsResult.reason;
        }

        if (breakdownResult.status === 'fulfilled') {
          setOrderStatusBreakdown(breakdownResult.value);
          writeAdminSessionCache(ADMIN_CACHE_KEYS.analyticsOrderStatus, breakdownResult.value);
          setOrderStatusBreakdownFailed(false);
        } else {
          logger.error('Order status breakdown request failed', {
            error: breakdownResult.reason,
          });
          setOrderStatusBreakdown(null);
          setOrderStatusBreakdownFailed(true);
        }
      } catch (err: unknown) {
        logger.error('Error fetching analytics', { error: err });
        
        // Extract meaningful error message
        let errorMessage = t('admin.analytics.errorLoading');
        
        if (err instanceof Error) {
          if (err.message.includes('<!DOCTYPE') || err.message.includes('<html')) {
            errorMessage = t('admin.analytics.apiNotFound');
          } else if (err.message.includes('Expected JSON')) {
            errorMessage = t('admin.analytics.invalidResponse');
          } else {
            errorMessage = err.message;
          }
        } else if (err && typeof err === 'object' && 'data' in err) {
          const errorData = err as { data?: { detail?: string } };
          if (errorData.data?.detail) {
            errorMessage = errorData.data.detail;
          }
        }
        
        setError(errorMessage);
        setOrderStatusBreakdown(null);
        setOrderStatusBreakdownFailed(false);
        alert(`${t('admin.common.error')}: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    const fetchAdminStats = async () => {
      try {
        logger.debug('Fetching admin stats for Total Users card');
        const stats = await apiClient.get<AdminStatsSummary>('/api/v1/supersudo/stats');
        const usersCount = stats?.users?.total ?? null;
        setTotalUsers(usersCount);
        logger.info('Admin stats loaded for Total Users', { usersCount });
      } catch (err: unknown) {
        logger.error('Error fetching admin stats', { error: err });
        setTotalUsers(null);
      }
    };

    fetchAnalytics();
    fetchAdminStats();
  }, [isLoggedIn, isAdmin, period, startDate, endDate, t]);

  return {
    analytics,
    orderStatusBreakdown,
    orderStatusBreakdownFailed,
    totalUsers,
    loading,
    error,
  };
}





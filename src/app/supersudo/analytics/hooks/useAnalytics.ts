import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { useTranslation } from '../../../../lib/i18n-client';
import { ADMIN_CACHE_KEYS, buildAnalyticsCacheKey, buildAnalyticsRequestParams } from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';
import type { AnalyticsData, OrderStatusBreakdownData } from '../types';

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
  orderStatusBreakdownFailed: boolean;
  loading: boolean;
  error: string | null;
}

function buildAnalyticsCacheKeyForPeriod(
  period: string,
  startDate: string,
  endDate: string,
): string {
  return buildAnalyticsCacheKey({ period, startDate, endDate });
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
  const tRef = useRef(t);
  tRef.current = t;

  const initialAnalyticsKey = buildAnalyticsCacheKeyForPeriod(period, startDate, endDate);
  const cachedAnalytics = readAdminSessionCache<AnalyticsData>(
    initialAnalyticsKey,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const cachedBreakdown = readAdminSessionCache<OrderStatusBreakdownData>(
    ADMIN_CACHE_KEYS.analyticsOrderStatus,
    ADMIN_SESSION_CACHE_TTL_MS,
  );

  const hadAnalyticsCacheRef = useRef(cachedAnalytics !== null);
  const hadBreakdownCacheRef = useRef(cachedBreakdown !== null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(cachedAnalytics);
  const [orderStatusBreakdown, setOrderStatusBreakdown] =
    useState<OrderStatusBreakdownData | null>(cachedBreakdown);
  const [orderStatusBreakdownFailed, setOrderStatusBreakdownFailed] = useState(false);
  const [loading, setLoading] = useState(
    cachedAnalytics === null || cachedBreakdown === null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      return;
    }

    const analyticsCacheKey = buildAnalyticsCacheKeyForPeriod(period, startDate, endDate);
    const cachedForPeriod = readAdminSessionCache<AnalyticsData>(
      analyticsCacheKey,
      ADMIN_SESSION_CACHE_TTL_MS,
    );
    const cachedBreakdownForPeriod = readAdminSessionCache<OrderStatusBreakdownData>(
      ADMIN_CACHE_KEYS.analyticsOrderStatus,
      ADMIN_SESSION_CACHE_TTL_MS,
    );

    if (cachedForPeriod !== null && cachedBreakdownForPeriod !== null) {
      setAnalytics(cachedForPeriod);
      setOrderStatusBreakdown(cachedBreakdownForPeriod);
      setOrderStatusBreakdownFailed(false);
      setLoading(false);
      setError(null);
      hadAnalyticsCacheRef.current = true;
      hadBreakdownCacheRef.current = true;
      return;
    }

    const fetchAnalytics = async () => {
      try {
        beginAdminDataFetch(hadAnalyticsCacheRef.current, setLoading);
        if (cachedForPeriod) {
          setAnalytics(cachedForPeriod);
        }
        if (cachedBreakdownForPeriod) {
          setOrderStatusBreakdown(cachedBreakdownForPeriod);
        }
        setError(null);
        setOrderStatusBreakdownFailed(false);

        const params = buildAnalyticsRequestParams({ period, startDate, endDate });
        const [analyticsResult, breakdownResult] = await Promise.allSettled([
          cachedForPeriod
            ? Promise.resolve(cachedForPeriod)
            : dedupedAdminRequest(analyticsCacheKey, () =>
                apiClient.get<AnalyticsData>('/api/v1/supersudo/analytics', { params }),
              ),
          cachedBreakdownForPeriod
            ? Promise.resolve(cachedBreakdownForPeriod)
            : dedupedAdminRequest(ADMIN_CACHE_KEYS.analyticsOrderStatus, () =>
                apiClient.get<OrderStatusBreakdownData>(
                  '/api/v1/supersudo/analytics/order-status-breakdown',
                ),
              ),
        ]);

        if (analyticsResult.status === 'fulfilled') {
          logger.info('Analytics data loaded', { period, hasData: !!analyticsResult.value });
          setAnalytics(analyticsResult.value);
          writeAdminSessionCache(analyticsCacheKey, analyticsResult.value);
          hadAnalyticsCacheRef.current = true;
        } else {
          throw analyticsResult.reason;
        }

        if (breakdownResult.status === 'fulfilled') {
          setOrderStatusBreakdown(breakdownResult.value);
          writeAdminSessionCache(ADMIN_CACHE_KEYS.analyticsOrderStatus, breakdownResult.value);
          setOrderStatusBreakdownFailed(false);
          hadBreakdownCacheRef.current = true;
        } else {
          logger.error('Order status breakdown request failed', {
            error: breakdownResult.reason,
          });
          if (!hadBreakdownCacheRef.current) {
            setOrderStatusBreakdown(null);
          }
          setOrderStatusBreakdownFailed(true);
        }
      } catch (err: unknown) {
        logger.error('Error fetching analytics', { error: err });

        let errorMessage = tRef.current('admin.analytics.errorLoading');

        if (err instanceof Error) {
          if (err.message.includes('<!DOCTYPE') || err.message.includes('<html')) {
            errorMessage = tRef.current('admin.analytics.apiNotFound');
          } else if (err.message.includes('Expected JSON')) {
            errorMessage = tRef.current('admin.analytics.invalidResponse');
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
        if (!hadBreakdownCacheRef.current) {
          setOrderStatusBreakdown(null);
        }
        setOrderStatusBreakdownFailed(false);
        alert(`${tRef.current('admin.common.error')}: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnalytics();
  }, [isLoggedIn, isAdmin, period, startDate, endDate]);

  return {
    analytics,
    orderStatusBreakdown,
    orderStatusBreakdownFailed,
    loading,
    error,
  };
}

import { useState, useEffect, useRef } from 'react';

import { STOCK_ANALYTICS_PAGE_LIMIT } from '@/lib/constants/stock-analytics-ui';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { buildAdminListCacheKey } from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';
import type { StockAnalyticsData } from '../types';

interface UseStockAnalyticsParams {
  isLoggedIn: boolean;
  isAdmin: boolean;
  locale: string;
}

interface UseStockAnalyticsReturn {
  stockAnalytics: StockAnalyticsData | null;
  loading: boolean;
  failed: boolean;
}

/**
 * Fetches admin stock lists (out of stock / low stock) — independent of sales period.
 */
export function useStockAnalytics({
  isLoggedIn,
  isAdmin,
  locale,
}: UseStockAnalyticsParams): UseStockAnalyticsReturn {
  const stockCacheKey = buildAdminListCacheKey('analytics/stock', {
    locale,
    limit: String(STOCK_ANALYTICS_PAGE_LIMIT),
  });
  const cachedStock = readAdminSessionCache<StockAnalyticsData>(
    stockCacheKey,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const hadCacheRef = useRef(Boolean(cachedStock));
  const [stockAnalytics, setStockAnalytics] = useState<StockAnalyticsData | null>(cachedStock);
  const [loading, setLoading] = useState(!hadCacheRef.current);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      return;
    }

    const fetchStock = async () => {
      try {
        beginAdminDataFetch(hadCacheRef.current, setLoading);
        setFailed(false);
        const result = await apiClient.get<StockAnalyticsData>('/api/v1/supersudo/analytics/stock', {
          params: {
            locale,
            limit: String(STOCK_ANALYTICS_PAGE_LIMIT),
          },
        });
        setStockAnalytics(result);
        writeAdminSessionCache(stockCacheKey, result);
        hadCacheRef.current = true;
      } catch (err: unknown) {
        logger.error('Admin stock analytics request failed', { error: err });
        if (!hadCacheRef.current) {
          setStockAnalytics(null);
        }
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchStock();
  }, [isLoggedIn, isAdmin, locale, stockCacheKey]);

  return { stockAnalytics, loading, failed };
}

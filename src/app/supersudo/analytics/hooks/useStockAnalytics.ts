import { useState, useEffect } from 'react';

import { STOCK_ANALYTICS_PAGE_LIMIT } from '@/lib/constants/stock-analytics-ui';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
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
  const [stockAnalytics, setStockAnalytics] = useState<StockAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      return;
    }

    const fetchStock = async () => {
      try {
        setLoading(true);
        setFailed(false);
        const result = await apiClient.get<StockAnalyticsData>('/api/v1/supersudo/analytics/stock', {
          params: {
            locale,
            limit: String(STOCK_ANALYTICS_PAGE_LIMIT),
          },
        });
        setStockAnalytics(result);
      } catch (err: unknown) {
        logger.error('Admin stock analytics request failed', { error: err });
        setStockAnalytics(null);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchStock();
  }, [isLoggedIn, isAdmin, locale]);

  return { stockAnalytics, loading, failed };
}

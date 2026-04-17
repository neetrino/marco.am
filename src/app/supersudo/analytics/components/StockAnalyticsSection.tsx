'use client';

import { Card } from '@shop/ui';

import { useTranslation } from '../../../../lib/i18n-client';
import type { StockAnalyticsData } from '../types';
import { StockVariantTable } from './StockVariantTable';

interface StockAnalyticsSectionProps {
  data: StockAnalyticsData | null;
  loading: boolean;
  failed: boolean;
}

export function StockAnalyticsSection({ data, loading, failed }: StockAnalyticsSectionProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Card className="p-6 mb-6 bg-white shadow-sm border border-gray-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <p className="text-gray-600">{t('admin.analytics.stockLoading')}</p>
        </div>
      </Card>
    );
  }

  if (failed || !data) {
    return (
      <Card className="p-4 mb-6 border border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-950">{t('admin.analytics.stockLoadFailed')}</p>
      </Card>
    );
  }

  const threshold = data.lowStockThreshold;
  const maxLow = Math.max(0, threshold - 1);

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{t('admin.analytics.stockTitle')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {t('admin.analytics.stockHint')
            .replace('{max}', String(maxLow))
            .replace('{threshold}', String(threshold))}
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <StockVariantTable
          title={t('admin.analytics.stockOutOfStockTitle')}
          hint={t('admin.analytics.stockOutOfStockHint')}
          emptyLabel={t('admin.analytics.stockEmptyOut')}
          total={data.outOfStock.total}
          items={data.outOfStock.items}
          shownCount={data.outOfStock.items.length}
          t={t}
        />
        <StockVariantTable
          title={t('admin.analytics.stockLowStockTitle')}
          hint={t('admin.analytics.stockLowStockHint').replace('{max}', String(maxLow))}
          emptyLabel={t('admin.analytics.stockEmptyLow')}
          total={data.lowStock.total}
          items={data.lowStock.items}
          shownCount={data.lowStock.items.length}
          t={t}
        />
      </div>
    </div>
  );
}

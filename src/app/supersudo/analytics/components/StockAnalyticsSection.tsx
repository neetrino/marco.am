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
      <Card className="admin-card mb-6 border-marco-border/70 bg-white/95 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-marco-black" />
          <p className="text-marco-text/75">{t('admin.analytics.stockLoading')}</p>
        </div>
      </Card>
    );
  }

  if (failed || !data) {
    return (
      <Card className="admin-card mb-6 border border-amber-200/80 bg-amber-50/80 p-4 shadow-sm">
        <p className="text-sm text-amber-950">{t('admin.analytics.stockLoadFailed')}</p>
      </Card>
    );
  }

  const threshold = data.lowStockThreshold;
  const maxLow = Math.max(0, threshold - 1);

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-marco-black">{t('admin.analytics.stockTitle')}</h2>
        <p className="mt-1 text-sm text-marco-text/70">
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

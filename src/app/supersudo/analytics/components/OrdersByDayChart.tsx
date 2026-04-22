'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { LineChart } from '../LineChart';
import { formatCurrency, formatDateShort } from '../utils';
import type { AnalyticsData } from '../types';

interface OrdersByDayChartProps {
  ordersByDay: AnalyticsData['ordersByDay'];
}

export function OrdersByDayChart({ ordersByDay }: OrdersByDayChartProps) {
  const { t } = useTranslation();

  return (
    <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-6 shadow-sm">
      <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-marco-black">{t('admin.analytics.ordersByDay')}</h2>
          <p className="mt-0.5 text-sm text-marco-text/70">{t('admin.analytics.dailyOrderTrends')}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-marco-yellow/30 text-marco-black">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      {ordersByDay.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-marco-text/65">{t('admin.analytics.noDataAvailable')}</p>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-2xl border border-marco-border/80 bg-white/80 p-4">
            <LineChart data={ordersByDay} />
          </div>

          <div className="space-y-3">
            {ordersByDay.map((day) => {
              const maxCount = Math.max(...ordersByDay.map(d => d.count), 1);
              const percentage = (day.count / maxCount) * 100;

              return (
                <div
                  key={day._id}
                  className="group flex items-center gap-4 rounded-2xl border border-marco-border/80 bg-white/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/10"
                >
                  <div className="w-28 flex-shrink-0 text-sm font-semibold text-marco-text/80">
                    {formatDateShort(day._id)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1 overflow-hidden rounded-full bg-marco-gray h-8 shadow-inner">
                        <div
                          className="flex h-8 items-center justify-between rounded-full bg-marco-yellow px-3 transition-all duration-700"
                          style={{ width: `${Math.max(percentage, 8)}%` }}
                        >
                          <span className="text-xs font-bold text-marco-black">
                            {t('admin.analytics.ordersLabel').replace('{count}', day.count.toString())}
                          </span>
                        </div>
                      </div>
                      <div className="w-32 flex-shrink-0 text-right">
                        <p className="text-sm font-semibold text-marco-black">
                          {formatCurrency(day.revenue)}
                        </p>
                        <p className="mt-0.5 text-xs text-marco-text/65">{t('admin.analytics.revenue')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

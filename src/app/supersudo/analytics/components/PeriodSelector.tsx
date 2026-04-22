'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { formatDate } from '../utils';
import type { AnalyticsData } from '../types';

interface PeriodSelectorProps {
  period: string;
  startDate: string;
  endDate: string;
  analytics: AnalyticsData | null;
  onPeriodChange: (period: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function PeriodSelector({
  period,
  startDate,
  endDate,
  analytics,
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
}: PeriodSelectorProps) {
  const { t } = useTranslation();

  return (
    <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-6 shadow-sm">
      <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-marco-black">{t('admin.analytics.timePeriod')}</h2>
        {analytics && (
          <div className="rounded-xl border border-marco-border/70 bg-marco-gray/40 px-3 py-1.5 text-sm text-marco-text/75">
            {formatDate(analytics.dateRange.start)} - {formatDate(analytics.dateRange.end)}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="mb-2 block text-sm font-medium text-marco-text/80">
            {t('admin.analytics.period')}
          </label>
          <select
            value={period}
            onChange={(e) => {
              onPeriodChange(e.target.value);
              if (e.target.value !== 'custom') {
                onStartDateChange('');
                onEndDateChange('');
              }
            }}
            className="admin-field"
          >
            <option value="day">{t('admin.analytics.today')}</option>
            <option value="week">{t('admin.analytics.last7Days')}</option>
            <option value="month">{t('admin.analytics.last30Days')}</option>
            <option value="year">{t('admin.analytics.lastYear')}</option>
            <option value="custom">{t('admin.analytics.customRange')}</option>
          </select>
        </div>
        {period === 'custom' && (
          <>
            <div className="min-w-[200px] flex-1">
              <label className="mb-2 block text-sm font-medium text-marco-text/80">
                {t('admin.analytics.startDate')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="admin-field"
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <label className="mb-2 block text-sm font-medium text-marco-text/80">
                {t('admin.analytics.endDate')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="admin-field"
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}





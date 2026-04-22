'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import type { OrderStatusBreakdownData } from '../types';

interface OrderStatusBreakdownProps {
  data: OrderStatusBreakdownData;
}

type StatusRowKey = 'pending' | 'processing' | 'completed' | 'cancelled' | 'other';

const ROW_KEYS: StatusRowKey[] = [
  'pending',
  'processing',
  'completed',
  'cancelled',
  'other',
];

function windowFor(
  data: OrderStatusBreakdownData,
  period: 'today' | 'week' | 'month'
) {
  return data.windows.find((w) => w.period === period);
}

export function OrderStatusBreakdown({ data }: OrderStatusBreakdownProps) {
  const { t } = useTranslation();

  const today = windowFor(data, 'today');
  const week = windowFor(data, 'week');
  const month = windowFor(data, 'month');

  if (!today || !week || !month) {
    return null;
  }

  const labelForPeriod = (period: 'today' | 'week' | 'month') => {
    if (period === 'today') {
      return t('admin.analytics.today');
    }
    if (period === 'week') {
      return t('admin.analytics.last7Days');
    }
    return t('admin.analytics.last30Days');
  };

  const labelForRow = (key: StatusRowKey) => {
    const map: Record<StatusRowKey, string> = {
      pending: 'admin.analytics.orderStatusPending',
      processing: 'admin.analytics.orderStatusProcessing',
      completed: 'admin.analytics.orderStatusCompleted',
      cancelled: 'admin.analytics.orderStatusCancelled',
      other: 'admin.analytics.orderStatusOther',
    };
    return t(map[key]);
  };

  const cell = (w: (typeof data.windows)[0], key: StatusRowKey) =>
    w.byStatus[key].toString();

  return (
    <Card className="admin-card mb-6 overflow-hidden border-marco-border/70 bg-white/95 p-6 shadow-sm">
      <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-sky-300 to-marco-black/30" />
      <h2 className="text-xl font-semibold text-marco-black mb-4">
        {t('admin.analytics.orderStatusBreakdownTitle')}
      </h2>
      <p className="text-sm text-marco-text/75 mb-4">
        {t('admin.analytics.orderStatusBreakdownHint')}
      </p>
      <div className="overflow-x-auto rounded-2xl border border-marco-border/80 bg-white/80">
        <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-marco-border/80 bg-marco-gray/30">
            <th className="py-2 pr-4 font-medium text-marco-text/75">
              {t('admin.analytics.orderStatusColumn')}
            </th>
            <th className="py-2 px-2 text-right font-medium text-marco-text/75">
              {labelForPeriod('today')}
            </th>
            <th className="py-2 px-2 text-right font-medium text-marco-text/75">
              {labelForPeriod('week')}
            </th>
            <th className="py-2 px-2 text-right font-medium text-marco-text/75">
              {labelForPeriod('month')}
            </th>
          </tr>
        </thead>
        <tbody>
          {ROW_KEYS.map((key) => (
            <tr key={key} className="border-b border-marco-border/60">
              <td className="py-2 pr-4 text-marco-black">{labelForRow(key)}</td>
              <td className="py-2 px-2 text-right tabular-nums">{cell(today, key)}</td>
              <td className="py-2 px-2 text-right tabular-nums">{cell(week, key)}</td>
              <td className="py-2 px-2 text-right tabular-nums">{cell(month, key)}</td>
            </tr>
          ))}
          <tr className="bg-marco-yellow/10 font-semibold text-marco-black">
            <td className="py-2 pr-4">{t('admin.analytics.orderStatusTotal')}</td>
            <td className="py-2 px-2 text-right tabular-nums">{today.totalOrders}</td>
            <td className="py-2 px-2 text-right tabular-nums">{week.totalOrders}</td>
            <td className="py-2 px-2 text-right tabular-nums">{month.totalOrders}</td>
          </tr>
        </tbody>
        </table>
      </div>
    </Card>
  );
}

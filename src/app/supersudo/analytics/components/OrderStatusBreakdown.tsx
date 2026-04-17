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
    <Card className="p-6 mb-6 overflow-x-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t('admin.analytics.orderStatusBreakdownTitle')}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {t('admin.analytics.orderStatusBreakdownHint')}
      </p>
      <table className="min-w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-2 pr-4 font-medium text-gray-700">
              {t('admin.analytics.orderStatusColumn')}
            </th>
            <th className="py-2 px-2 font-medium text-gray-700 text-right">
              {labelForPeriod('today')}
            </th>
            <th className="py-2 px-2 font-medium text-gray-700 text-right">
              {labelForPeriod('week')}
            </th>
            <th className="py-2 px-2 font-medium text-gray-700 text-right">
              {labelForPeriod('month')}
            </th>
          </tr>
        </thead>
        <tbody>
          {ROW_KEYS.map((key) => (
            <tr key={key} className="border-b border-gray-100">
              <td className="py-2 pr-4 text-gray-800">{labelForRow(key)}</td>
              <td className="py-2 px-2 text-right tabular-nums">{cell(today, key)}</td>
              <td className="py-2 px-2 text-right tabular-nums">{cell(week, key)}</td>
              <td className="py-2 px-2 text-right tabular-nums">{cell(month, key)}</td>
            </tr>
          ))}
          <tr className="font-semibold text-gray-900">
            <td className="py-2 pr-4">{t('admin.analytics.orderStatusTotal')}</td>
            <td className="py-2 px-2 text-right tabular-nums">{today.totalOrders}</td>
            <td className="py-2 px-2 text-right tabular-nums">{week.totalOrders}</td>
            <td className="py-2 px-2 text-right tabular-nums">{month.totalOrders}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

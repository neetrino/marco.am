'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { formatCurrency } from '../utils';
import type { AnalyticsData } from '../types';

interface CustomerAnalyticsProps {
  data: AnalyticsData['customerAnalytics'];
}

export function CustomerAnalytics({ data }: CustomerAnalyticsProps) {
  const { t } = useTranslation();
  const { newVsRepeat, topCustomersBySpend } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-6 shadow-sm">
        <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-emerald-300 to-marco-black/30" />
        <h3 className="text-lg font-semibold text-marco-black mb-2">
          {t('admin.analytics.customerNewVsRepeatTitle')}
        </h3>
        <p className="text-sm text-marco-text/75 mb-4">
          {t('admin.analytics.customerNewVsRepeatHint')}
        </p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
            <dt className="text-emerald-800 font-medium">
              {t('admin.analytics.customerNewCustomers')}
            </dt>
            <dd className="text-2xl font-bold text-emerald-900">
              {newVsRepeat.newCustomers}
            </dd>
          </div>
          <div className="rounded-lg bg-sky-50 p-3 border border-sky-100">
            <dt className="text-sky-800 font-medium">
              {t('admin.analytics.customerRepeatCustomers')}
            </dt>
            <dd className="text-2xl font-bold text-sky-900">
              {newVsRepeat.repeatCustomers}
            </dd>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-2 border-t border-marco-border/70 pt-2">
            <div>
              <dt className="text-marco-text/70">
                {t('admin.analytics.customerOrdersFromNew')}
              </dt>
              <dd className="font-semibold text-marco-black">
                {newVsRepeat.ordersFromNewCustomers}
              </dd>
            </div>
            <div>
              <dt className="text-marco-text/70">
                {t('admin.analytics.customerOrdersFromRepeat')}
              </dt>
              <dd className="font-semibold text-marco-black">
                {newVsRepeat.ordersFromRepeatCustomers}
              </dd>
            </div>
          </div>
          {newVsRepeat.ordersUnattributed > 0 ? (
            <div className="col-span-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded p-2">
              {t('admin.analytics.customerUnattributedOrders').replace(
                '{count}',
                String(newVsRepeat.ordersUnattributed)
              )}
            </div>
          ) : null}
        </dl>
      </Card>

      <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-6 shadow-sm">
        <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-cyan-300 to-marco-black/30" />
        <h3 className="text-lg font-semibold text-marco-black mb-2">
          {t('admin.analytics.topCustomersBySpendTitle')}
        </h3>
        <p className="text-sm text-marco-text/75 mb-4">
          {t('admin.analytics.topCustomersBySpendHint')}
        </p>
        {topCustomersBySpend.length === 0 ? (
          <p className="text-sm text-marco-text/70">{t('admin.analytics.noTopCustomers')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-marco-border/80 text-left text-marco-text/70">
                  <th className="py-2 pr-2 font-medium">
                    {t('admin.analytics.topCustomersColumnCustomer')}
                  </th>
                  <th className="py-2 pr-2 font-medium text-right">
                    {t('admin.analytics.topCustomersColumnSpend')}
                  </th>
                  <th className="py-2 font-medium text-right">
                    {t('admin.analytics.topCustomersColumnOrders')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCustomersBySpend.map((row) => (
                  <tr key={`${row.identityType}-${row.userId ?? row.email}`} className="border-b border-marco-border/60">
                    <td className="py-2 pr-2 text-marco-black">{row.displayName}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {formatCurrency(row.totalSpend, row.currency)}
                    </td>
                    <td className="py-2 text-right tabular-nums">{row.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

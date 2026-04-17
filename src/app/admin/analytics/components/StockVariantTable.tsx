'use client';

import Link from 'next/link';

import { Card } from '@shop/ui';

import type { StockAnalyticsVariantRow } from '../types';
import { formatAnalyticsSku } from '../utils';

type TFn = (key: string) => string;

interface StockVariantTableProps {
  title: string;
  hint: string;
  emptyLabel: string;
  total: number;
  items: StockAnalyticsVariantRow[];
  shownCount: number;
  t: TFn;
}

function skuDisplay(sku: string | null, translate: TFn): string {
  if (sku === null || sku === '') {
    return translate('admin.dashboard.na');
  }
  return formatAnalyticsSku(sku, translate);
}

export function StockVariantTable({
  title,
  hint,
  emptyLabel,
  total,
  items,
  shownCount,
  t,
}: StockVariantTableProps) {
  return (
    <Card className="p-6 bg-white shadow-sm border border-gray-200 rounded-xl">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{hint}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-2 pr-4">{t('admin.analytics.stockColumnProduct')}</th>
                <th className="py-2 pr-4">{t('admin.analytics.skuLabel')}</th>
                <th className="py-2 pr-4">{t('admin.analytics.stockColumnBrand')}</th>
                <th className="py-2 pr-4">{t('admin.analytics.stockColumnStock')}</th>
                <th className="py-2">{t('admin.analytics.stockColumnReserved')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.variantId} className="border-b border-gray-100">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {row.imageUrl ? (
                        <img
                          src={row.imageUrl}
                          alt=""
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
                        />
                      ) : null}
                      <Link
                        href={`/admin/products/add?id=${row.productId}`}
                        className="font-medium text-blue-700 hover:underline truncate"
                      >
                        {row.productTitle}
                      </Link>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-700 whitespace-nowrap">{skuDisplay(row.sku, t)}</td>
                  <td className="py-3 pr-4 text-gray-700">{row.brandName ?? t('admin.dashboard.na')}</td>
                  <td className="py-3 pr-4 text-gray-900 font-medium">{row.stock}</td>
                  <td className="py-3 text-gray-700">{row.stockReserved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > 0 ? (
        <p className="text-xs text-gray-500 mt-4">
          {t('admin.analytics.stockShowing')
            .replace('{shown}', String(shownCount))
            .replace('{total}', String(total))}
        </p>
      ) : null}
    </Card>
  );
}

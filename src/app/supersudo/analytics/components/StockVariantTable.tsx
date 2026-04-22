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
    <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-6 shadow-sm">
      <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-marco-black">{title}</h3>
        <p className="mt-1 text-sm text-marco-text/70">{hint}</p>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-sm text-marco-text/70">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-marco-border/80 bg-white/80">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-marco-border/80 bg-marco-gray/30 text-left text-marco-text/75">
                <th className="py-2 pr-4 pl-3">{t('admin.analytics.stockColumnProduct')}</th>
                <th className="py-2 pr-4">{t('admin.analytics.skuLabel')}</th>
                <th className="py-2 pr-4">{t('admin.analytics.stockColumnBrand')}</th>
                <th className="py-2 pr-4">{t('admin.analytics.stockColumnStock')}</th>
                <th className="py-2 pr-3">{t('admin.analytics.stockColumnReserved')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.variantId} className="border-b border-marco-border/60">
                  <td className="py-3 pr-4 pl-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {row.imageUrl ? (
                        <img
                          src={row.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg border border-marco-border/80 object-cover"
                        />
                      ) : null}
                      <Link
                        href={`/supersudo/products/add?id=${row.productId}`}
                        className="truncate font-medium text-marco-text/85 hover:text-marco-black hover:underline"
                      >
                        {row.productTitle}
                      </Link>
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 text-marco-text/80">{skuDisplay(row.sku, t)}</td>
                  <td className="py-3 pr-4 text-marco-text/80">{row.brandName ?? t('admin.dashboard.na')}</td>
                  <td className="py-3 pr-4 font-medium text-marco-black">{row.stock}</td>
                  <td className="py-3 pr-3 text-marco-text/80">{row.stockReserved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > 0 ? (
        <p className="mt-4 text-xs text-marco-text/65">
          {t('admin.analytics.stockShowing')
            .replace('{shown}', String(shownCount))
            .replace('{total}', String(total))}
        </p>
      ) : null}
    </Card>
  );
}

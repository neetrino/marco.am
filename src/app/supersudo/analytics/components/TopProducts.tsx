'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { formatAnalyticsSku, formatCurrency } from '../utils';
import type { AnalyticsData } from '../types';

interface TopProductsProps {
  products: AnalyticsData['topProducts'];
}

export function TopProducts({ products }: TopProductsProps) {
  const { t } = useTranslation();

  return (
    <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-6 shadow-sm">
      <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-marco-black">{t('admin.analytics.topSellingProducts')}</h2>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-marco-yellow/30 text-marco-black">
          <svg className="h-4 w-4 text-marco-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>
      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-marco-text/70">{t('admin.analytics.noSalesDataAvailable')}</p>
          </div>
        ) : (
          products.map((product, index) => (
            <div
              key={product.productId}
              className="group flex items-center gap-4 rounded-2xl border border-marco-border/80 bg-white/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/10"
            >
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-orange-300 text-orange-900' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
              </div>
              {product.image && (
                <div className="flex-shrink-0">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-14 h-14 object-cover rounded-lg border border-gray-200 group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="mb-1 truncate text-sm font-semibold text-marco-black">{product.title}</p>
                <p className="mb-1 text-xs text-marco-text/70">{t('admin.analytics.skuLabel')}: {formatAnalyticsSku(product.sku, t)}</p>
                <div className="flex items-center gap-3 text-xs text-marco-text/75">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {t('admin.analytics.sold').replace('{count}', product.totalQuantity.toString())}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {t('admin.analytics.orders').replace('{count}', product.orderCount.toString())}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-marco-black">
                  {formatCurrency(product.totalRevenue)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}





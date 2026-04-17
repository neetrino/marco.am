'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { formatAnalyticsSku, formatCurrency } from '../utils';
import type { AnalyticsData } from '../types';

interface LeastSellingProductsProps {
  products: AnalyticsData['leastSellingProducts'];
}

export function LeastSellingProducts({ products }: LeastSellingProductsProps) {
  const { t } = useTranslation();

  return (
    <Card className="p-6 bg-white shadow-sm border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{t('admin.analytics.leastSellingProducts')}</h2>
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        </div>
      </div>
      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">{t('admin.analytics.noLeastSellingData')}</p>
          </div>
        ) : (
          products.map((product, index) => (
            <div
              key={product.productId}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-amber-300 hover:shadow-md transition-all duration-200 bg-gray-50 hover:bg-white group"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors bg-gray-200 text-gray-700">
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
                <p className="text-sm font-semibold text-gray-900 truncate mb-1">{product.title}</p>
                <p className="text-xs text-gray-500 mb-1">
                  {t('admin.analytics.skuLabel')}: {formatAnalyticsSku(product.sku, t)}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-600">
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
                <p className="text-base font-bold text-gray-900">
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

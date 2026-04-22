'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import { CurrencyCode } from '../../../../lib/currency';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsItemsProps {
  orderDetails: OrderDetails;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsItems({
  orderDetails,
  formatCurrency,
}: OrderDetailsItemsProps) {
  const { t } = useTranslation();

  if (!Array.isArray(orderDetails.items) || orderDetails.items.length === 0) {
    return (
      <Card className="p-4 md:p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('admin.orders.orderDetails.items')}</h3>
        <div className="text-sm text-gray-500">{t('admin.orders.orderDetails.noItemsFound')}</div>
      </Card>
    );
  }

  const oc = orderDetails.currency || 'AMD';

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('admin.orders.orderDetails.items')}</h3>
      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500 w-14">
                {t('admin.orders.orderDetails.thumbnail')}
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">{t('admin.orders.orderDetails.product')}</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">{t('admin.orders.orderDetails.sku')}</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">{t('admin.orders.orderDetails.colorSize')}</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">{t('admin.orders.orderDetails.qty')}</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">{t('admin.orders.orderDetails.price')}</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">{t('admin.orders.orderDetails.totalCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {orderDetails.items.map((item) => {
              const allOptions = item.variantOptions || [];
              return (
                <tr key={item.id} className="group transition-colors hover:bg-amber-50/50">
                  <td className="px-3 py-2 align-top">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded border border-gray-200 object-cover"
                        onError={(e) => {
                          e.currentTarget.classList.add('hidden');
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded border border-dashed border-gray-200 bg-gray-50" />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-slate-900 transition-colors group-hover:text-amber-900">
                      {item.productTitle}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{item.sku}</td>
                  <td className="px-3 py-2">
                    {allOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-2 items-center">
                        {allOptions.map((opt, optIndex) => {
                          if (!opt.attributeKey || !opt.value) return null;
                          const displayLabel = opt.label || opt.value;
                          const hasImage = opt.imageUrl && opt.imageUrl.trim() !== '';
                          return (
                            <div key={optIndex} className="flex items-center gap-1.5">
                              {hasImage ? (
                                <img
                                  src={opt.imageUrl!}
                                  alt={displayLabel}
                                  className="w-4 h-4 rounded border border-gray-300 object-cover flex-shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.classList.add('hidden');
                                  }}
                                />
                              ) : null}
                              <span className="text-xs text-gray-700 capitalize">{displayLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(item.unitPrice, oc, 'AMD')}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(item.total, oc, 'AMD')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}


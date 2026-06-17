'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import type { CurrencyCode } from '../../../../lib/currency';
import type { OrderDetails } from '../useOrders';
import {
  ORDER_DETAIL_LABEL_CLASS,
  ORDER_DETAIL_SECTION_CLASS,
} from './order-details-layout.constants';

interface OrderDetailsItemsProps {
  orderDetails: OrderDetails;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

function formatVariantOptionsLabel(
  options: NonNullable<OrderDetails['items'][number]['variantOptions']>,
): string {
  const labels = options
    .map((option) => option.label || option.value)
    .filter((value): value is string => Boolean(value?.trim()));
  return labels.length > 0 ? labels.join(', ') : '—';
}

export function OrderDetailsItems({
  orderDetails,
  formatCurrency,
}: OrderDetailsItemsProps) {
  const { t } = useTranslation();
  const oc = orderDetails.currency || 'AMD';
  const totals = orderDetails.totals;
  const ship = orderDetails.shippingAddress as { city?: string } | null | undefined;
  const shipCity = ship?.city?.trim() ?? '';

  return (
    <section className={ORDER_DETAIL_SECTION_CLASS}>
      <h3 className={`${ORDER_DETAIL_LABEL_CLASS} mb-3`}>
        {t('admin.orders.orderDetails.items')}
      </h3>

      {!Array.isArray(orderDetails.items) || orderDetails.items.length === 0 ? (
        <p className="text-sm text-slate-500">{t('admin.orders.orderDetails.noItemsFound')}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="w-14 px-3 py-2.5 font-semibold uppercase tracking-wide text-[11px] text-slate-500">
                    {t('admin.orders.orderDetails.thumbnail')}
                  </th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wide text-[11px] text-slate-500">
                    {t('admin.orders.orderDetails.product')}
                  </th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wide text-[11px] text-slate-500">
                    {t('admin.orders.orderDetails.sku')}
                  </th>
                  <th className="px-3 py-2.5 font-semibold uppercase tracking-wide text-[11px] text-slate-500">
                    {t('admin.orders.orderDetails.colorSize')}
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wide text-[11px] text-slate-500">
                    {t('admin.orders.orderDetails.qty')}
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wide text-[11px] text-slate-500">
                    {t('admin.orders.orderDetails.price')}
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wide text-[11px] text-slate-500">
                    {t('admin.orders.orderDetails.totalCol')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orderDetails.items.map((item) => (
                  <tr key={item.id} className="text-slate-800">
                    <td className="px-3 py-3 align-top">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                          onError={(event) => {
                            event.currentTarget.classList.add('hidden');
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-dashed border-slate-200 bg-slate-50" />
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium">{item.productTitle}</td>
                    <td className="px-3 py-3 text-slate-600">{item.sku}</td>
                    <td className="px-3 py-3 text-slate-600 capitalize">
                      {formatVariantOptionsLabel(item.variantOptions ?? [])}
                    </td>
                    <td className="px-3 py-3 text-right">{item.quantity}</td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(item.unitPrice, oc, 'AMD')}
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      {formatCurrency(item.total, oc, 'AMD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totals ? (
            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-sm space-y-2 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between text-slate-700">
                  <span>{t('orders.orderSummary.subtotal')}</span>
                  <span>{formatCurrency(totals.subtotal, oc, 'AMD')}</span>
                </div>
                {totals.discount > 0 ? (
                  <div className="flex justify-between text-slate-700">
                    <span>{t('orders.orderSummary.discount')}</span>
                    <span>-{formatCurrency(totals.discount, oc, 'AMD')}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-slate-700">
                  <span>{t('orders.orderSummary.shipping')}</span>
                  <span>
                    {orderDetails.shippingMethod === 'pickup'
                      ? t('checkout.shipping.freePickup')
                      : `${formatCurrency(totals.shipping, oc, 'AMD')}${shipCity ? ` (${shipCity})` : ''}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                  <span>{t('orders.orderSummary.total')}</span>
                  <span>{formatCurrency(totals.total, oc, 'AMD')}</span>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

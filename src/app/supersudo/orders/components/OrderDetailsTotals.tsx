'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import type { CurrencyCode } from '../../../../lib/currency';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsTotalsProps {
  orderDetails: OrderDetails;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsTotals({
  orderDetails,
  formatCurrency,
}: OrderDetailsTotalsProps) {
  const { t } = useTranslation();

  if (!orderDetails.totals) {
    return null;
  }

  const oc = (orderDetails.totals.currency || orderDetails.currency || 'AMD') as CurrencyCode;
  const ship = orderDetails.shippingAddress as { city?: string } | null | undefined;
  const shipCity = ship?.city?.trim() ?? '';

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('orders.orderSummary.title')}</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-700">
          <span>{t('orders.orderSummary.subtotal')}</span>
          <span>{formatCurrency(orderDetails.totals.subtotal, oc, 'AMD')}</span>
        </div>
        {orderDetails.totals.discount > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>{t('orders.orderSummary.discount')}</span>
            <span>-{formatCurrency(orderDetails.totals.discount, oc, 'AMD')}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-700">
          <span>{t('orders.orderSummary.shipping')}</span>
          <span>
            {orderDetails.shippingMethod === 'pickup'
              ? t('checkout.shipping.freePickup')
              : formatCurrency(orderDetails.totals.shipping, oc, 'AMD') +
                (shipCity ? ` (${shipCity})` : '')}
          </span>
        </div>
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between text-base font-bold text-gray-900">
            <span>{t('orders.orderSummary.total')}</span>
            <span>{formatCurrency(orderDetails.totals.total, oc, 'AMD')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}


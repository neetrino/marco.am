'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import type { CurrencyCode } from '../../../../lib/currency';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsMetaProps {
  orderDetails: OrderDetails;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsMeta({ orderDetails, formatCurrency }: OrderDetailsMetaProps) {
  const { t } = useTranslation();
  const oc = orderDetails.currency || 'AMD';

  const orderTotal =
    orderDetails.totals != null
      ? formatCurrency(orderDetails.totals.total, oc, 'AMD')
      : formatCurrency(orderDetails.total, oc, 'AMD');

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('admin.orders.orderDetails.summary')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
        <div>
          <div>
            <span className="font-medium">{t('admin.orders.orderDetails.orderNumber')}</span> {orderDetails.number}
          </div>
          <div className="mt-1">
            <span className="font-medium">{t('admin.orders.orderDetails.total')}</span> {orderTotal}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {t('admin.orders.orderDetails.createdAt')}: {new Date(orderDetails.createdAt).toLocaleString()}
          </div>
          {orderDetails.updatedAt && (
            <div className="mt-1 text-xs text-gray-500">
              {t('admin.orders.orderDetails.updatedAt')}: {new Date(orderDetails.updatedAt).toLocaleString()}
            </div>
          )}
        </div>
        <div>
          <div>
            <span className="font-medium">{t('admin.orders.orderDetails.status')}</span> {orderDetails.status}
          </div>
          <div className="mt-1">
            <span className="font-medium">{t('admin.orders.orderDetails.payment')}</span> {orderDetails.paymentStatus}
          </div>
        </div>
        <div>
          {orderDetails.trackingNumber ? (
            <div>
              <span className="font-medium">{t('admin.orders.orderDetails.trackingNumber')}</span>{' '}
              {orderDetails.trackingNumber}
            </div>
          ) : null}
          {orderDetails.fulfilledAt ? (
            <div className="mt-1 text-xs text-gray-500">
              {t('admin.orders.orderDetails.fulfilledAt')}: {new Date(orderDetails.fulfilledAt).toLocaleString()}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

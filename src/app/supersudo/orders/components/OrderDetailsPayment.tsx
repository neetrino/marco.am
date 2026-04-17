'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import type { CurrencyCode } from '../../../../lib/currency';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsPaymentProps {
  orderDetails: OrderDetails;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsPayment({ orderDetails, formatCurrency }: OrderDetailsPaymentProps) {
  const { t } = useTranslation();
  const p = orderDetails.payment;
  const oc = orderDetails.currency || 'AMD';

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('admin.orders.orderDetails.paymentSection')}</h3>
      {p ? (
        <div className="text-sm text-gray-700 space-y-1">
          <div>
            <span className="font-medium">{t('admin.orders.orderDetails.provider')}</span> {p.provider}
          </div>
          {p.method ? (
            <div>
              <span className="font-medium">{t('admin.orders.orderDetails.method')}</span> {p.method}
            </div>
          ) : null}
          <div>
            <span className="font-medium">{t('admin.orders.orderDetails.amount')}</span>{' '}
            {formatCurrency(p.amount, p.currency || oc, 'AMD')}
          </div>
          <div>
            <span className="font-medium">{t('admin.orders.orderDetails.status')}</span> {p.status}
          </div>
          {p.cardBrand && p.cardLast4 ? (
            <div>
              {t('admin.orders.orderDetails.card')} {p.cardBrand} ••••{p.cardLast4}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-sm text-gray-500">{t('admin.orders.orderDetails.noPaymentInfo')}</div>
      )}
    </Card>
  );
}

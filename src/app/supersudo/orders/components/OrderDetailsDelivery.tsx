'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import { isCourierShipping } from '../../../../lib/constants/shipping-method';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsDeliveryProps {
  orderDetails: OrderDetails;
}

function countryLabel(code: string | undefined, t: (k: string) => string): string | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  if (upper === 'AM' || upper === 'ARMENIA') return t('admin.orders.orderDetails.countryAM');
  return code;
}

export function OrderDetailsDelivery({ orderDetails }: OrderDetailsDeliveryProps) {
  const { t } = useTranslation();
  const ship = orderDetails.shippingAddress as Record<string, string | undefined> | null | undefined;

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('admin.orders.orderDetails.deliverySection')}</h3>
      {orderDetails.shippingMethod === 'pickup' ? (
        <div className="text-sm text-gray-700 space-y-1">
          <div>
            <span className="font-medium">{t('admin.orders.orderDetails.shippingMethod')}</span>{' '}
            {t('admin.orders.orderDetails.pickup')}
          </div>
        </div>
      ) : isCourierShipping(orderDetails.shippingMethod) && ship ? (
        <div className="text-sm text-gray-700 space-y-1">
          <div className="mb-2">
            <span className="font-medium">{t('admin.orders.orderDetails.shippingMethod')}</span>{' '}
            {t('checkout.shipping.courier')}
          </div>
          {(ship.address || ship.addressLine1) && (
            <div>
              <span className="font-medium">{t('checkout.form.address')}:</span>{' '}
              {ship.address || ship.addressLine1}
              {ship.addressLine2 ? `, ${ship.addressLine2}` : ''}
            </div>
          )}
          {ship.city && (
            <div>
              <span className="font-medium">{t('checkout.form.city')}:</span> {ship.city}
            </div>
          )}
          {ship.countryCode && (
            <div>
              <span className="font-medium">{t('admin.orders.orderDetails.country')}:</span>{' '}
              {countryLabel(ship.countryCode, t)}
            </div>
          )}
          {ship.postalCode && (
            <div>
              <span className="font-medium">{t('checkout.form.postalCode')}:</span> {ship.postalCode}
            </div>
          )}
          {(ship.phone || ship.shippingPhone) && (
            <div className="mt-2">
              <span className="font-medium">{t('checkout.form.phoneNumber')}:</span>{' '}
              {ship.phone || ship.shippingPhone}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          <p>{t('admin.orders.orderDetails.noShippingAddress')}</p>
          {orderDetails.shippingMethod && (
            <p>
              {t('admin.orders.orderDetails.shippingMethod')}{' '}
              {orderDetails.shippingMethod === 'pickup'
                ? t('admin.orders.orderDetails.pickup')
                : isCourierShipping(orderDetails.shippingMethod)
                  ? t('checkout.shipping.courier')
                  : orderDetails.shippingMethod}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { getOrderShippingDisplay } from '../utils/order-details-display';
import type { OrderDetails } from '../useOrders';
import {
  ORDER_DETAIL_LABEL_CLASS,
  ORDER_DETAIL_SECTION_CLASS,
} from './order-details-layout.constants';

interface OrderDetailsDeliveryProps {
  orderDetails: OrderDetails;
}

export function OrderDetailsDelivery({ orderDetails }: OrderDetailsDeliveryProps) {
  const { t } = useTranslation();
  const shipping = getOrderShippingDisplay(orderDetails);

  const methodLabel =
    shipping.methodId === 'courier'
      ? t('checkout.shipping.courier')
      : shipping.methodId === 'pickup'
        ? t('checkout.shipping.pickupToggle')
        : orderDetails.shippingMethod || '—';

  const hasContent =
    shipping.methodId !== 'unknown' ||
    Boolean(shipping.addressLine) ||
    Boolean(shipping.city) ||
    Boolean(shipping.phone);

  return (
    <section className={ORDER_DETAIL_SECTION_CLASS}>
      <h3 className={`${ORDER_DETAIL_LABEL_CLASS} mb-3`}>
        {t('checkout.shippingAddress')}
      </h3>

      {!hasContent ? (
        <p className="text-sm text-slate-500">{t('admin.orders.orderDetails.noShippingAddress')}</p>
      ) : (
        <dl className="space-y-2 text-sm text-slate-800">
          <div>
            <dt className="sr-only">{t('admin.orders.orderDetails.shippingMethod')}</dt>
            <dd className="font-medium">{methodLabel}</dd>
          </div>
          {shipping.addressLine ? (
            <div>
              <dt className="sr-only">{t('checkout.shippingAddress')}</dt>
              <dd>{shipping.addressLine}</dd>
            </div>
          ) : null}
          {shipping.city ? (
            <div>
              <dt className="sr-only">{t('admin.orders.orderDetails.country')}</dt>
              <dd>{shipping.city}</dd>
            </div>
          ) : null}
          {shipping.phone ? (
            <div>
              <dt className="sr-only">{t('admin.dashboard.phone')}</dt>
              <dd>{shipping.phone}</dd>
            </div>
          ) : null}
          {orderDetails.trackingNumber ? (
            <div className="pt-1 text-xs text-slate-500">
              {t('admin.orders.orderDetails.trackingNumber')} {orderDetails.trackingNumber}
            </div>
          ) : null}
        </dl>
      )}
    </section>
  );
}

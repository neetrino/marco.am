'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { getOrderCustomerDisplay } from '../utils/order-details-display';
import { formatAdminOrderListCustomerName } from '../utils/order-list-display';
import type { Order, OrderDetails } from '../useOrders';
import {
  ORDER_DETAIL_LABEL_CLASS,
  ORDER_DETAIL_SECTION_CLASS,
} from './order-details-layout.constants';

interface OrderDetailsCustomerProps {
  orderDetails?: OrderDetails | null;
  listOrder?: Order | null;
}

export function OrderDetailsCustomer({
  orderDetails = null,
  listOrder = null,
}: OrderDetailsCustomerProps) {
  const { t } = useTranslation();
  const unknownLabel = t('admin.orders.unknownCustomer');
  const useListSource = Boolean(listOrder && !orderDetails);

  const nameLine = useListSource
    ? formatAdminOrderListCustomerName(listOrder!, unknownLabel)
    : orderDetails
      ? getOrderCustomerDisplay(orderDetails).displayName.trim() || unknownLabel
      : unknownLabel;

  const phone = useListSource
    ? listOrder!.customerPhone?.trim() || undefined
    : orderDetails
      ? getOrderCustomerDisplay(orderDetails).phone
      : undefined;

  const email = useListSource
    ? listOrder!.customerEmail?.trim() || undefined
    : orderDetails
      ? getOrderCustomerDisplay(orderDetails).email
      : undefined;

  return (
    <section className={ORDER_DETAIL_SECTION_CLASS}>
      <h3 className={`${ORDER_DETAIL_LABEL_CLASS} mb-3`}>
        {t('admin.orders.orderDetails.customer')}
      </h3>
      <dl className="space-y-2 text-sm text-slate-800">
        <div>
          <dt className="sr-only">{t('admin.orders.orderDetails.customer')}</dt>
          <dd className="font-medium">{nameLine}</dd>
        </div>
        {phone ? (
          <div>
            <dt className="sr-only">{t('admin.dashboard.phone')}</dt>
            <dd>{phone}</dd>
          </div>
        ) : null}
        {email ? (
          <div>
            <dt className="sr-only">{t('admin.dashboard.email')}</dt>
            <dd className="break-all text-slate-700">{email}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

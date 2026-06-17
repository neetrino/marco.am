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
  isPreview?: boolean;
}

export function OrderDetailsCustomer({
  orderDetails = null,
  listOrder = null,
  isPreview = false,
}: OrderDetailsCustomerProps) {
  const { t } = useTranslation();

  const nameLine =
    isPreview && listOrder
      ? formatAdminOrderListCustomerName(listOrder, t('admin.orders.unknownCustomer'))
      : orderDetails
        ? getOrderCustomerDisplay(orderDetails).displayName.trim() ||
          t('admin.orders.unknownCustomer')
        : listOrder
          ? formatAdminOrderListCustomerName(listOrder, t('admin.orders.unknownCustomer'))
          : t('admin.orders.unknownCustomer');

  const phone =
    isPreview && listOrder
      ? listOrder.customerPhone?.trim() || undefined
      : orderDetails
        ? getOrderCustomerDisplay(orderDetails).phone
        : listOrder?.customerPhone?.trim() || undefined;

  const email =
    isPreview && listOrder
      ? listOrder.customerEmail?.trim() || undefined
      : orderDetails
        ? getOrderCustomerDisplay(orderDetails).email
        : listOrder?.customerEmail?.trim() || undefined;

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

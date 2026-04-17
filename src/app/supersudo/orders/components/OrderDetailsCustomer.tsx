'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import { getOrderCustomerDisplay } from '../utils/order-details-display';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsCustomerProps {
  orderDetails: OrderDetails;
}

export function OrderDetailsCustomer({ orderDetails }: OrderDetailsCustomerProps) {
  const { t } = useTranslation();
  const { displayName, email, phone, userId } = getOrderCustomerDisplay(orderDetails);
  const nameLine = displayName.trim() || t('admin.orders.unknownCustomer');

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('admin.orders.orderDetails.customer')}</h3>
      <div className="text-sm text-gray-700 space-y-1">
        <div>{nameLine}</div>
        {email ? <div>{email}</div> : null}
        {phone ? <div>{phone}</div> : null}
        {userId ? (
          <div className="text-xs text-gray-500 pt-1">
            {t('admin.orders.orderDetails.accountUserId')}: {userId}
          </div>
        ) : (
          <div className="text-xs text-gray-500 pt-1">{t('admin.orders.orderDetails.guestCheckout')}</div>
        )}
      </div>
    </Card>
  );
}

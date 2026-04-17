'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsNotesProps {
  orderDetails: OrderDetails;
}

export function OrderDetailsNotes({ orderDetails }: OrderDetailsNotesProps) {
  const { t } = useTranslation();
  const notes = orderDetails.notes?.trim();
  const adminNotes = orderDetails.adminNotes?.trim();
  if (!notes && !adminNotes) {
    return null;
  }

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('admin.orders.orderDetails.notesSection')}</h3>
      <div className="text-sm text-gray-700 space-y-3">
        {notes ? (
          <div>
            <div className="font-medium text-gray-800">{t('admin.orders.orderDetails.customerNotes')}</div>
            <p className="mt-1 whitespace-pre-wrap">{notes}</p>
          </div>
        ) : null}
        {adminNotes ? (
          <div>
            <div className="font-medium text-gray-800">{t('admin.orders.orderDetails.internalNotes')}</div>
            <p className="mt-1 whitespace-pre-wrap">{adminNotes}</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

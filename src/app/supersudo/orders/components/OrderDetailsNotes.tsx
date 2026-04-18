'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsNotesProps {
  orderDetails: OrderDetails;
  saving: boolean;
  onSaveAdminNotes: (adminNotes: string) => Promise<void>;
}

export function OrderDetailsNotes({
  orderDetails,
  saving,
  onSaveAdminNotes,
}: OrderDetailsNotesProps) {
  const { t } = useTranslation();
  const notes = orderDetails.notes?.trim();
  const [internalNotesDraft, setInternalNotesDraft] = useState(
    orderDetails.adminNotes ?? ''
  );

  useEffect(() => {
    setInternalNotesDraft(orderDetails.adminNotes ?? '');
  }, [orderDetails.id, orderDetails.adminNotes]);

  const trimmedServerValue = (orderDetails.adminNotes ?? '').trim();
  const trimmedDraftValue = internalNotesDraft.trim();
  const isDirty = trimmedDraftValue !== trimmedServerValue;

  const handleSaveClick = async () => {
    await onSaveAdminNotes(internalNotesDraft);
  };

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
        <div>
          <label
            htmlFor="admin-internal-notes"
            className="font-medium text-gray-800 block"
          >
            {t('admin.orders.orderDetails.internalNotes')}
          </label>
          <textarea
            id="admin-internal-notes"
            value={internalNotesDraft}
            onChange={(event) => setInternalNotesDraft(event.target.value)}
            className="mt-2 w-full min-h-28 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
            placeholder={t('admin.orders.orderDetails.internalNotesPlaceholder')}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={!isDirty || saving}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-gray-700 transition-colors"
            >
              {saving
                ? t('admin.orders.orderDetails.savingInternalNotes')
                : t('admin.orders.orderDetails.saveInternalNotes')}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import type { OrderDetails } from '../useOrders';
import {
  ORDER_DETAIL_LABEL_CLASS,
  ORDER_DETAIL_SECTION_CLASS,
} from './order-details-layout.constants';
import { ADMIN_PRIMARY_COMPACT_BUTTON_CLASS } from '../../components/admin-button.classes';

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
  const customerNotes = orderDetails.notes?.trim();
  const [internalNotesDraft, setInternalNotesDraft] = useState(
    orderDetails.adminNotes ?? '',
  );

  useEffect(() => {
    setInternalNotesDraft(orderDetails.adminNotes ?? '');
  }, [orderDetails.id, orderDetails.adminNotes]);

  const trimmedServerValue = (orderDetails.adminNotes ?? '').trim();
  const isDirty = internalNotesDraft.trim() !== trimmedServerValue;

  const handleSaveClick = async () => {
    await onSaveAdminNotes(internalNotesDraft);
  };

  return (
    <section className={ORDER_DETAIL_SECTION_CLASS}>
      <h3 className={`${ORDER_DETAIL_LABEL_CLASS} mb-3`}>
        {customerNotes
          ? t('admin.orders.orderDetails.notesSection')
          : t('admin.orders.orderDetails.internalNotes')}
      </h3>
      <div className="space-y-3 text-sm text-slate-800">
        {customerNotes ? (
          <div>
            <p className="mb-1 font-medium">{t('admin.orders.orderDetails.customerNotes')}</p>
            <p className="whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
              {customerNotes}
            </p>
          </div>
        ) : null}
        <div>
          {customerNotes ? (
            <label htmlFor="admin-internal-notes" className="mb-1 block font-medium">
              {t('admin.orders.orderDetails.internalNotes')}
            </label>
          ) : null}
          <textarea
            id="admin-internal-notes"
            value={internalNotesDraft}
            onChange={(event) => setInternalNotesDraft(event.target.value)}
            className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder={t('admin.orders.orderDetails.internalNotesPlaceholder')}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={!isDirty || saving}
              className={ADMIN_PRIMARY_COMPACT_BUTTON_CLASS}
            >
              {saving
                ? t('admin.orders.orderDetails.savingInternalNotes')
                : t('admin.orders.orderDetails.saveInternalNotes')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

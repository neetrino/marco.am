'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { CurrencyCode } from '../../../../lib/currency';
import { AdminSideSheet } from '../../components/AdminSideSheet';
import { OrderDetailsBody } from './OrderDetailsBody';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsSheetProps {
  open: boolean;
  orderDetails: OrderDetails | null;
  loading: boolean;
  savingAdminNotes: boolean;
  onSaveAdminNotes: (adminNotes: string) => Promise<void>;
  onClose: () => void;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsSheet({
  open,
  orderDetails,
  loading,
  savingAdminNotes,
  onSaveAdminNotes,
  onClose,
  formatCurrency,
}: OrderDetailsSheetProps) {
  const { t } = useTranslation();

  const title = orderDetails?.number
    ? `${t('admin.orders.orderDetails.title')} #${orderDetails.number}`
    : t('admin.orders.orderDetails.title');

  return (
    <AdminSideSheet
      open={open}
      onClose={onClose}
      ariaLabel={title}
      closeLabel={t('admin.common.close')}
      header={
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {loading && !orderDetails ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white" />
            <p className="text-gray-600 dark:text-zinc-400">
              {t('admin.orders.orderDetails.loadingOrderDetails')}
            </p>
          </div>
        ) : orderDetails ? (
          <OrderDetailsBody
            orderDetails={orderDetails}
            savingAdminNotes={savingAdminNotes}
            onSaveAdminNotes={onSaveAdminNotes}
            formatCurrency={formatCurrency}
          />
        ) : (
          <div className="py-6 text-sm text-gray-600 dark:text-zinc-400">
            {t('admin.orders.orderDetails.failedToLoad')}
          </div>
        )}
      </div>
    </AdminSideSheet>
  );
}

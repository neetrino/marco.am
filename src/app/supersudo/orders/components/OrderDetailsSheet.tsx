'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { CurrencyCode } from '../../../../lib/currency';
import { AdminSideSheet } from '../../components/AdminSideSheet';
import {
  ADMIN_ORDER_SIDE_SHEET_CLOSE_OUTSIDE_CLASS,
  ADMIN_ORDER_SIDE_SHEET_PANEL_CLASS,
} from '../../components/admin-side-sheet.constants';
import { OrderDetailsBody } from './OrderDetailsBody';
import { OrderDetailsSummaryBar } from './OrderDetailsSummaryBar';
import { OrderDetailsCustomer } from './OrderDetailsCustomer';
import { hasLoadedOrderDetails } from '../utils/order-list-display';
import { isOrderSheetLoadingDetails } from '../utils/order-details-preview';
import type { Order, OrderDetails } from '../useOrders';
import { ORDER_DETAIL_SECTION_CLASS } from './order-details-layout.constants';

interface OrderDetailsSheetProps {
  open: boolean;
  listOrder: Order | null;
  orderDetails: OrderDetails | null;
  loading: boolean;
  savingAdminNotes: boolean;
  onSaveAdminNotes: (adminNotes: string) => Promise<void>;
  onClose: () => void;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
  onStatusChange?: (status: string) => void;
  onPaymentStatusChange?: (paymentStatus: string) => void;
  updatingStatus?: boolean;
  updatingPaymentStatus?: boolean;
}

function DeliveryPreviewSkeleton() {
  return <div className={`${ORDER_DETAIL_SECTION_CLASS} h-36 animate-pulse`} aria-hidden />;
}

function ItemsPreviewSkeleton() {
  return <div className={`${ORDER_DETAIL_SECTION_CLASS} h-48 animate-pulse`} aria-hidden />;
}

export function OrderDetailsSheet({
  open,
  listOrder,
  orderDetails,
  loading,
  savingAdminNotes,
  onSaveAdminNotes,
  onClose,
  formatCurrency,
  onStatusChange,
  onPaymentStatusChange,
  updatingStatus,
  updatingPaymentStatus,
}: OrderDetailsSheetProps) {
  const { t } = useTranslation();

  const orderNumber = orderDetails?.number ?? listOrder?.number;
  const title = orderNumber
    ? `${t('admin.orders.orderDetails.title')} — ${orderNumber}`
    : t('admin.orders.orderDetails.title');

  const createdAt = orderDetails?.createdAt ?? listOrder?.createdAt;
  const createdLabel = createdAt
    ? `${t('admin.orders.orderDetails.createdAt')}: ${new Date(createdAt).toLocaleString()}`
    : null;

  const hasFullDetails = hasLoadedOrderDetails(orderDetails);
  const isPreview = isOrderSheetLoadingDetails(loading, orderDetails);

  return (
    <AdminSideSheet
      open={open}
      onClose={onClose}
      ariaLabel={title}
      closeLabel={t('admin.common.close')}
      panelClassName={ADMIN_ORDER_SIDE_SHEET_PANEL_CLASS}
      closeOutsideClassName={ADMIN_ORDER_SIDE_SHEET_CLOSE_OUTSIDE_CLASS}
      header={
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          {createdLabel ? (
            <p className="shrink-0 text-xs text-slate-500 dark:text-zinc-400">{createdLabel}</p>
          ) : null}
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 px-5 py-4 dark:bg-zinc-950/40">
        {!listOrder && !orderDetails && loading ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white" />
            <p className="text-gray-600 dark:text-zinc-400">
              {t('admin.orders.orderDetails.loadingOrderDetails')}
            </p>
          </div>
        ) : hasFullDetails && orderDetails ? (
          <OrderDetailsBody
            orderDetails={orderDetails}
            listOrder={listOrder}
            savingAdminNotes={savingAdminNotes}
            onSaveAdminNotes={onSaveAdminNotes}
            formatCurrency={formatCurrency}
            onStatusChange={onStatusChange}
            onPaymentStatusChange={onPaymentStatusChange}
            updatingStatus={updatingStatus}
            updatingPaymentStatus={updatingPaymentStatus}
          />
        ) : listOrder ? (
          <div className="space-y-4">
            <OrderDetailsSummaryBar
              orderDetails={orderDetails}
              listOrder={listOrder}
              isPreview={isPreview}
              formatCurrency={formatCurrency}
              onStatusChange={onStatusChange}
              onPaymentStatusChange={onPaymentStatusChange}
              updatingStatus={updatingStatus}
              updatingPaymentStatus={updatingPaymentStatus}
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DeliveryPreviewSkeleton />
              <OrderDetailsCustomer listOrder={listOrder} isPreview />
            </div>
            <ItemsPreviewSkeleton />
          </div>
        ) : (
          <div className="py-6 text-sm text-gray-600 dark:text-zinc-400">
            {t('admin.orders.orderDetails.failedToLoad')}
          </div>
        )}
      </div>
    </AdminSideSheet>
  );
}

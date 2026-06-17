'use client';

import type { ReactNode } from 'react';
import { CashPaymentIcon } from '@/app/checkout/components/CashPaymentIcon';
import type { AdminOrderListStatus } from '@/lib/constants/admin-order-list-status';
import { useTranslation } from '../../../../lib/i18n-client';
import type { CurrencyCode } from '../../../../lib/currency';
import { ADMIN_ORDER_STATUS_I18N_KEY } from '../utils/order-status-labels';
import { getPaymentMethodLabel, isCashPaymentMethodLabel } from '../utils/order-details-display';
import { getPaymentStatusColor, getStatusColor } from '../utils/orderUtils';
import type { OrderDetails } from '../useOrders';
import {
  ORDER_DETAIL_LABEL_CLASS,
  ORDER_DETAIL_SECTION_CLASS,
} from './order-details-layout.constants';

interface OrderDetailsSummaryBarProps {
  orderDetails: OrderDetails;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
  onStatusChange?: (status: string) => void;
  onPaymentStatusChange?: (paymentStatus: string) => void;
  updatingStatus?: boolean;
  updatingPaymentStatus?: boolean;
}

function readOrderStatusLabel(status: string, t: (key: string) => string): string {
  const key = ADMIN_ORDER_STATUS_I18N_KEY[status as AdminOrderListStatus];
  return key ? t(key) : status;
}

function SummaryCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 px-3 py-2 first:pl-0 last:pr-0 md:px-4">
      <div className={ORDER_DETAIL_LABEL_CLASS}>{label}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function OrderDetailsSummaryBar({
  orderDetails,
  formatCurrency,
  onStatusChange,
  onPaymentStatusChange,
  updatingStatus = false,
  updatingPaymentStatus = false,
}: OrderDetailsSummaryBarProps) {
  const { t } = useTranslation();
  const oc = orderDetails.currency || 'AMD';
  const orderTotal =
    orderDetails.totals != null
      ? formatCurrency(orderDetails.totals.total, oc, 'AMD')
      : formatCurrency(orderDetails.total, oc, 'AMD');
  const paymentMethod = getPaymentMethodLabel(orderDetails);
  const paymentMethodLabel =
    isCashPaymentMethodLabel(paymentMethod)
      ? t('checkout.payment.cash')
      : paymentMethod;

  return (
    <section className={ORDER_DETAIL_SECTION_CLASS}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-slate-200">
        <SummaryCell label={t('admin.orders.orderDetails.summaryTotalLabel')}>
          <p className="text-lg font-bold text-slate-900">{orderTotal}</p>
        </SummaryCell>

        <SummaryCell label={t('admin.orders.orderDetails.summaryStatusLabel')}>
          {onStatusChange ? (
            updatingStatus ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-slate-900" />
                {t('admin.orders.updating')}
              </div>
            ) : (
              <select
                value={orderDetails.status}
                onChange={(event) => onStatusChange(event.target.value)}
                className={`h-9 w-full max-w-[12rem] cursor-pointer rounded-lg border-0 px-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 ${getStatusColor(orderDetails.status)}`}
              >
                <option value="pending">{t(ADMIN_ORDER_STATUS_I18N_KEY.pending)}</option>
                <option value="processing">{t(ADMIN_ORDER_STATUS_I18N_KEY.processing)}</option>
                <option value="completed">{t(ADMIN_ORDER_STATUS_I18N_KEY.completed)}</option>
                <option value="cancelled">{t(ADMIN_ORDER_STATUS_I18N_KEY.cancelled)}</option>
              </select>
            )
          ) : (
            <span
              className={`inline-flex rounded-lg px-2.5 py-1 text-sm font-semibold ${getStatusColor(orderDetails.status)}`}
            >
              {readOrderStatusLabel(orderDetails.status, t)}
            </span>
          )}
        </SummaryCell>

        <SummaryCell label={t('admin.orders.orderDetails.summaryMethodLabel')}>
          <div className="flex items-center gap-2">
            {isCashPaymentMethodLabel(paymentMethod) ? (
              <CashPaymentIcon className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : null}
            <span className="text-sm font-medium capitalize text-slate-900">{paymentMethodLabel}</span>
          </div>
          {orderDetails.payment?.cardBrand && orderDetails.payment.cardLast4 ? (
            <p className="mt-1 text-xs text-slate-500">
              {orderDetails.payment.cardBrand} ••••{orderDetails.payment.cardLast4}
            </p>
          ) : null}
        </SummaryCell>

        <SummaryCell label={t('admin.orders.orderDetails.summaryPaymentLabel')}>
          {onPaymentStatusChange ? (
            updatingPaymentStatus ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-slate-900" />
                {t('admin.orders.updating')}
              </div>
            ) : (
              <select
                value={orderDetails.paymentStatus}
                onChange={(event) => onPaymentStatusChange(event.target.value)}
                className={`h-9 w-full max-w-[12rem] cursor-pointer rounded-lg border-0 px-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 ${getPaymentStatusColor(orderDetails.paymentStatus)}`}
              >
                <option value="paid">{t('admin.orders.paid')}</option>
                <option value="pending">{t('admin.orders.pendingPayment')}</option>
                <option value="failed">{t('admin.orders.failed')}</option>
              </select>
            )
          ) : (
            <span
              className={`inline-flex rounded-lg px-2.5 py-1 text-sm font-semibold ${getPaymentStatusColor(orderDetails.paymentStatus)}`}
            >
              {orderDetails.paymentStatus === 'paid'
                ? t('admin.orders.paid')
                : orderDetails.paymentStatus === 'failed'
                  ? t('admin.orders.failed')
                  : t('admin.orders.pendingPayment')}
            </span>
          )}
        </SummaryCell>
      </div>
    </section>
  );
}

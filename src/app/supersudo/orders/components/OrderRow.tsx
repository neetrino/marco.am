'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { convertPrice, CurrencyCode } from '../../../../lib/currency';
import { getStatusColor, getPaymentStatusColor } from '../utils/orderUtils';
import { ADMIN_ORDER_STATUS_I18N_KEY } from '../utils/order-status-labels';
import type { Order } from '../useOrders';

interface OrderRowProps {
  order: Order;
  selected: boolean;
  updatingStatus: boolean;
  updatingPaymentStatus: boolean;
  onToggleSelect: () => void;
  onViewDetails: () => void;
  onStatusChange: (newStatus: string) => void;
  onPaymentStatusChange: (newPaymentStatus: string) => void;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderRow({
  order,
  selected,
  updatingStatus,
  updatingPaymentStatus,
  onToggleSelect,
  onViewDetails,
  onStatusChange,
  onPaymentStatusChange,
  formatCurrency,
}: OrderRowProps) {
  const { t } = useTranslation();

  const calculateTotalWithoutShipping = () => {
    if (order.subtotal !== undefined && order.discountAmount !== undefined && order.taxAmount !== undefined) {
      const subtotalAMD = convertPrice(order.subtotal, 'USD', 'AMD');
      const discountAMD = convertPrice(order.discountAmount, 'USD', 'AMD');
      const taxAMD = convertPrice(order.taxAmount, 'USD', 'AMD');
      const totalWithoutShippingAMD = subtotalAMD - discountAMD + taxAMD;
      return formatCurrency(totalWithoutShippingAMD, order.currency, 'AMD');
    } else {
      const totalAMD = convertPrice(order.total, 'USD', 'AMD');
      const shippingAMD = order.shippingAmount || 0;
      const totalWithoutShippingAMD = totalAMD - shippingAMD;
      return formatCurrency(totalWithoutShippingAMD, order.currency, 'AMD');
    }
  };

  return (
    <tr className="group transition-colors hover:bg-amber-50/50">
      <td className="px-2.5 py-2.5">
        <input
          type="checkbox"
          aria-label={t('admin.orders.selectOrder').replace('{number}', order.number)}
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
        />
      </td>
      <td
        className="cursor-pointer whitespace-nowrap px-3 py-2.5"
        onClick={onViewDetails}
      >
        <div className="inline-flex max-w-full rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-slate-700 transition-colors group-hover:bg-amber-100 group-hover:text-amber-900">
          <span className="truncate">#{order.number}</span>
        </div>
      </td>
      <td
        className="cursor-pointer px-3 py-2.5"
        onClick={onViewDetails}
      >
        <div className="truncate text-sm font-semibold leading-5 text-slate-900 transition-colors group-hover:text-amber-900">
          {[order.customerFirstName, order.customerLastName].filter(Boolean).join(' ') || t('admin.orders.unknownCustomer')}
        </div>
        {order.customerPhone && (
          <div className="truncate text-xs text-slate-500">{order.customerPhone}</div>
        )}
        <div className="truncate text-[11px] text-slate-500 transition-colors group-hover:text-amber-700">
          {t('admin.orders.viewOrderDetails')}
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-sm font-semibold text-slate-900">
        {calculateTotalWithoutShipping()}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-500">
        {order.itemsCount}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5">
        <div className="flex items-center gap-2">
          {updatingStatus ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900"></div>
              <span className="text-xs text-slate-500">{t('admin.orders.updating')}</span>
            </div>
          ) : (
            <select
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`h-8 cursor-pointer rounded-lg border-0 px-2.5 py-1 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${getStatusColor(order.status)}`}
            >
              <option value="pending">{t(ADMIN_ORDER_STATUS_I18N_KEY.pending)}</option>
              <option value="processing">{t(ADMIN_ORDER_STATUS_I18N_KEY.processing)}</option>
              <option value="completed">{t(ADMIN_ORDER_STATUS_I18N_KEY.completed)}</option>
              <option value="cancelled">{t(ADMIN_ORDER_STATUS_I18N_KEY.cancelled)}</option>
            </select>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5">
        <div className="flex items-center gap-2">
          {updatingPaymentStatus ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900"></div>
              <span className="text-xs text-slate-500">{t('admin.orders.updating')}</span>
            </div>
          ) : (
            <select
              value={order.paymentStatus}
              onChange={(e) => onPaymentStatusChange(e.target.value)}
              className={`h-8 cursor-pointer rounded-lg border-0 px-2.5 py-1 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${getPaymentStatusColor(order.paymentStatus)}`}
            >
              <option value="paid">{t('admin.orders.paid')}</option>
              <option value="pending">{t('admin.orders.pendingPayment')}</option>
              <option value="failed">{t('admin.orders.failed')}</option>
            </select>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-500">
        {new Date(order.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}


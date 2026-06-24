'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import { CurrencyCode } from '../../../../lib/currency';
import { OrderRow } from './OrderRow';
import { AdminTablePagination } from '../../components/AdminTablePagination';
import {
  ORDER_TABLE_HEADER_CELL,
  ORDER_TABLE_LAST_CELL,
  ORDER_TABLE_CLASS,
  ORDER_TABLE_HEAD_CLASS,
  ORDER_TABLE_HEAD_ROW_CLASS,
} from './orders-table-layout';
import type { Order } from '../useOrders';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  selectedIds: Set<string>;
  updatingStatuses: Set<string>;
  updatingPaymentStatuses: Set<string>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  meta: { total: number; page: number; limit: number; totalPages: number } | null;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSort: (column: string) => void;
  onViewDetails: (orderId: string) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onPaymentStatusChange: (orderId: string, newPaymentStatus: string) => void;
  onPageChange: (newPage: number) => void;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrdersTable({
  orders,
  loading,
  selectedIds,
  updatingStatuses,
  updatingPaymentStatuses,
  sortBy,
  sortOrder,
  page,
  meta,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  onViewDetails,
  onStatusChange,
  onPaymentStatusChange,
  onPageChange,
  formatCurrency,
}: OrdersTableProps) {
  const { t } = useTranslation();
  const headerCell = `${ORDER_TABLE_HEADER_CELL}`;
  const headerCellLast = `${ORDER_TABLE_HEADER_CELL} ${ORDER_TABLE_LAST_CELL}`;

  if (loading) {
    return (
      <Card className="admin-card border-slate-200/80 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
        <div className="text-center py-8">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-gray-600">{t('admin.orders.loadingOrders')}</p>
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="admin-card border-slate-200/80 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
        <div className="text-center py-8">
          <p className="text-gray-600">{t('admin.orders.noOrders')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="admin-table-card border-slate-200/80 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
      <div className="overflow-x-auto">
        <table className={ORDER_TABLE_CLASS}>
          <colgroup>
            <col className="w-9" />
            <col className="w-14" />
            <col className="w-[26%]" />
            <col className="w-[11%]" />
            <col className="w-[8%]" />
            <col className="w-[17%]" />
            <col className="w-[16%]" />
            <col className="w-[11%]" />
          </colgroup>
          <thead className={ORDER_TABLE_HEAD_CLASS}>
            <tr className={ORDER_TABLE_HEAD_ROW_CLASS}>
              <th className={`${headerCell} px-2.5`}>
                <input
                  type="checkbox"
                  aria-label={t('admin.orders.selectAllOrders')}
                  checked={orders.length > 0 && orders.every(o => selectedIds.has(o.id))}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
              </th>
              <th className={`${headerCell} px-1.5`}>
                {t('admin.orders.orderNumber')}
              </th>
              <th className={headerCell}>
                {t('admin.orders.customer')}
              </th>
              <th
                className={`${headerCell} cursor-pointer select-none hover:bg-slate-100`}
                onClick={() => onSort('total')}
              >
                <div className="flex items-center gap-1">
                  {t('admin.orders.total')}
                  <div className="flex flex-col">
                    <svg
                      className={`w-3 h-3 ${sortBy === 'total' && sortOrder === 'asc' ? 'text-gray-900' : 'text-gray-400'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <svg
                      className={`w-3 h-3 -mt-1 ${sortBy === 'total' && sortOrder === 'desc' ? 'text-gray-900' : 'text-gray-400'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </th>
              <th className={headerCell}>
                {t('admin.orders.items')}
              </th>
              <th className={headerCell}>
                {t('admin.orders.status')}
              </th>
              <th className={headerCell}>
                {t('admin.orders.payment')}
              </th>
              <th
                className={`${headerCellLast} cursor-pointer select-none hover:bg-slate-100`}
                onClick={() => onSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  {t('admin.orders.date')}
                  <div className="flex flex-col">
                    <svg
                      className={`w-3 h-3 ${sortBy === 'createdAt' && sortOrder === 'asc' ? 'text-gray-900' : 'text-gray-400'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <svg
                      className={`w-3 h-3 -mt-1 ${sortBy === 'createdAt' && sortOrder === 'desc' ? 'text-gray-900' : 'text-gray-400'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white [&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-slate-100">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                selected={selectedIds.has(order.id)}
                updatingStatus={updatingStatuses.has(order.id)}
                updatingPaymentStatus={updatingPaymentStatuses.has(order.id)}
                onToggleSelect={() => onToggleSelect(order.id)}
                onViewDetails={() => onViewDetails(order.id)}
                onStatusChange={(newStatus) => onStatusChange(order.id, newStatus)}
                onPaymentStatusChange={(newPaymentStatus) => onPaymentStatusChange(order.id, newPaymentStatus)}
                formatCurrency={formatCurrency}
              />
            ))}
          </tbody>
        </table>
      </div>

      {meta && (
        <AdminTablePagination
          embedded
          currentPage={page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          onPageChange={onPageChange}
        />
      )}
    </Card>
  );
}


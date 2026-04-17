'use client';

import { ADMIN_ORDER_LIST_STATUS_VALUES } from '@/lib/constants/admin-order-list-status';
import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import type { useOrders } from '../useOrders';
import { ADMIN_ORDER_STATUS_I18N_KEY } from '../utils/order-status-labels';

interface OrdersFiltersProps {
  statusFilter: string;
  paymentStatusFilter: string;
  searchQuery: string;
  updateMessage: { type: 'success' | 'error'; text: string } | null;
  setStatusFilter: (value: string) => void;
  setPaymentStatusFilter: (value: string) => void;
  setSearchQuery: (value: string) => void;
  setPage: (value: number | ((prev: number) => number)) => void;
  router: ReturnType<typeof useOrders>['router'];
  searchParams: ReturnType<typeof useOrders>['searchParams'];
}

export function OrdersFilters({
  statusFilter,
  paymentStatusFilter,
  searchQuery,
  updateMessage,
  setStatusFilter,
  setPaymentStatusFilter,
  setSearchQuery,
  setPage,
  router,
  searchParams,
}: OrdersFiltersProps) {
  const { t } = useTranslation();

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    const newUrl = params.toString() ? `/supersudo/orders?${params.toString()}` : '/supersudo/orders';
    router.push(newUrl, { scroll: false });
  };

  const handlePaymentStatusChange = (newPaymentStatus: string) => {
    setPaymentStatusFilter(newPaymentStatus);
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newPaymentStatus) {
      params.set('paymentStatus', newPaymentStatus);
    } else {
      params.delete('paymentStatus');
    }
    const newUrl = params.toString() ? `/supersudo/orders?${params.toString()}` : '/supersudo/orders';
    router.push(newUrl, { scroll: false });
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchQuery(newSearch);
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newSearch.trim()) {
      params.set('search', newSearch.trim());
    } else {
      params.delete('search');
    }
    const newUrl = params.toString() ? `/supersudo/orders?${params.toString()}` : '/supersudo/orders';
    router.push(newUrl, { scroll: false });
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex gap-4 items-center flex-wrap">
        <div
          className="flex flex-wrap gap-2 items-center"
          role="group"
          aria-label={t('admin.orders.orderStatusFilters')}
        >
          <button
            type="button"
            onClick={() => handleStatusChange('')}
            className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
              statusFilter === ''
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('admin.orders.allStatuses')}
          </button>
          {ADMIN_ORDER_LIST_STATUS_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleStatusChange(value)}
              className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                statusFilter === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t(ADMIN_ORDER_STATUS_I18N_KEY[value])}
            </button>
          ))}
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={paymentStatusFilter}
          onChange={(e) => handlePaymentStatusChange(e.target.value)}
        >
          <option value="">{t('admin.orders.allPaymentStatuses')}</option>
          <option value="paid">{t('admin.orders.paid')}</option>
          <option value="pending">{t('admin.orders.pendingPayment')}</option>
          <option value="failed">{t('admin.orders.failed')}</option>
        </select>
        <input
          type="text"
          placeholder={t('admin.orders.searchPlaceholder')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {updateMessage && (
          <div
            className={`px-4 py-2 rounded-md text-sm ${
              updateMessage.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {updateMessage.text}
          </div>
        )}
      </div>
    </Card>
  );
}


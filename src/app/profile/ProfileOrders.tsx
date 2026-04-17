import Link from 'next/link';
import { Button, Card } from '@shop/ui';
import {
  ADMIN_ORDER_LIST_STATUS_VALUES,
  isAdminOrderListStatus,
} from '@/lib/constants/admin-order-list-status';
import { ADMIN_ORDER_STATUS_I18N_KEY } from '../supersudo/orders/utils/order-status-labels';
import { formatPriceInCurrency, convertPrice, type CurrencyCode } from '../../lib/currency';
import { getStatusColor, getPaymentStatusColor, getFulfillmentStatusColor } from './utils';
import type { OrderListItem } from './types';

interface ProfileOrdersProps {
  orders: OrderListItem[];
  ordersLoading: boolean;
  ordersPage: number;
  setOrdersPage: (page: number | ((prev: number) => number)) => void;
  ordersMeta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  ordersStatusFilter: string;
  onOrdersStatusFilterChange: (value: string) => void;
  currency: CurrencyCode;
  onOrderClick: (orderNumber: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
  t: (key: string) => string;
}

export function ProfileOrders({
  orders,
  ordersLoading,
  ordersPage,
  setOrdersPage,
  ordersMeta,
  ordersStatusFilter,
  onOrdersStatusFilterChange,
  currency,
  onOrderClick,
  t,
}: ProfileOrdersProps) {
  const statusFilterButtons = (
    <div
      className="flex flex-wrap gap-2 mb-6"
      role="group"
      aria-label={t('profile.orders.filterByStatus')}
    >
      <button
        type="button"
        onClick={() => onOrdersStatusFilterChange('')}
        className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
          ordersStatusFilter === ''
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
          onClick={() => onOrdersStatusFilterChange(value)}
          className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
            ordersStatusFilter === value
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {t(ADMIN_ORDER_STATUS_I18N_KEY[value])}
        </button>
      ))}
    </div>
  );

  if (ordersLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('profile.orders.title')}</h2>
        {statusFilterButtons}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('profile.orders.title')}</h2>
        {statusFilterButtons}
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {ordersStatusFilter
              ? t('profile.orders.noOrdersInFilter')
              : t('profile.orders.noOrders')}
          </p>
          {ordersStatusFilter ? (
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={() => onOrdersStatusFilterChange('')}
            >
              {t('profile.orders.showAllOrders')}
            </Button>
          ) : null}
          <Link href="/products">
            <Button variant="primary">{t('profile.dashboard.startShopping')}</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('profile.orders.title')}</h2>
      {statusFilterButtons}
      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.number}`}
            onClick={(e) => onOrderClick(order.number, e)}
            className="block border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-6 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{t('profile.orders.orderNumber')}{order.number}</h3>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-0.5">{t('profile.dashboard.orderStatus')}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                      {isAdminOrderListStatus(order.status)
                        ? t(ADMIN_ORDER_STATUS_I18N_KEY[order.status])
                        : order.status}
                    </span>
                  </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-0.5">{t('profile.dashboard.paymentStatus')}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-0.5">{t('profile.dashboard.fulfillmentStatus')}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getFulfillmentStatusColor(order.fulfillmentStatus)}`}>
                          {order.fulfillmentStatus}
                        </span>
                      </div>
                    </div>
                <p className="text-sm text-gray-600">
                  {order.itemsCount} {order.itemsCount !== 1 ? t('profile.orders.items') : t('profile.orders.item')} • {t('profile.dashboard.placedOn')} {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-bold text-gray-900">
                  {(() => {
                    if (order.subtotal !== undefined && order.discountAmount !== undefined && order.taxAmount !== undefined) {
                      const subtotalAMD = convertPrice(order.subtotal, 'USD', 'AMD');
                      const discountAMD = convertPrice(order.discountAmount, 'USD', 'AMD');
                      const taxAMD = convertPrice(order.taxAmount, 'USD', 'AMD');
                      const totalWithoutShippingAMD = subtotalAMD - discountAMD + taxAMD;
                      const totalDisplay = currency === 'AMD' ? totalWithoutShippingAMD : convertPrice(totalWithoutShippingAMD, 'AMD', currency);
                      return formatPriceInCurrency(totalDisplay, currency);
                    } else {
                      const totalAMD = convertPrice(order.total, 'USD', 'AMD');
                      const shippingAMD = order.shippingAmount || 0;
                      const totalWithoutShippingAMD = totalAMD - shippingAMD;
                      const totalDisplay = currency === 'AMD' ? totalWithoutShippingAMD : convertPrice(totalWithoutShippingAMD, 'AMD', currency);
                      return formatPriceInCurrency(totalDisplay, currency);
                    }
                  })()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('profile.dashboard.viewDetails')}</p>
              </div>
            </div>
          </Link>
        ))}
        
        {/* Pagination */}
        {ordersMeta && ordersMeta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {t('profile.orders.page')} {ordersMeta.page} {t('profile.orders.of')} {ordersMeta.totalPages} • {ordersMeta.total} {t('profile.orders.totalOrders')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrdersPage(prev => Math.max(1, prev - 1))}
                disabled={ordersPage === 1 || ordersLoading}
              >
                {t('profile.orders.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrdersPage(prev => Math.min(ordersMeta.totalPages, prev + 1))}
                disabled={ordersPage === ordersMeta.totalPages || ordersLoading}
              >
                {t('profile.orders.next')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}




import { convertPrice, type CurrencyCode } from '@/lib/currency';
import type { Order } from '../useOrders';

type OrderListTotalInput = Pick<
  Order,
  'subtotal' | 'discountAmount' | 'taxAmount' | 'total' | 'shippingAmount' | 'currency'
>;

/** Same total display as admin orders table row. */
export function formatAdminOrderListTotal(
  order: OrderListTotalInput,
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string,
): string {
  if (
    order.subtotal !== undefined &&
    order.discountAmount !== undefined &&
    order.taxAmount !== undefined
  ) {
    const subtotalAmd = convertPrice(order.subtotal, 'USD', 'AMD');
    const discountAmd = convertPrice(order.discountAmount, 'USD', 'AMD');
    const taxAmd = convertPrice(order.taxAmount, 'USD', 'AMD');
    const totalWithoutShippingAmd = subtotalAmd - discountAmd + taxAmd;
    return formatCurrency(totalWithoutShippingAmd, order.currency, 'AMD');
  }

  const totalAmd = convertPrice(order.total, 'USD', 'AMD');
  const shippingAmd = order.shippingAmount || 0;
  const totalWithoutShippingAmd = totalAmd - shippingAmd;
  return formatCurrency(totalWithoutShippingAmd, order.currency, 'AMD');
}

export function formatAdminOrderListCustomerName(
  order: Pick<Order, 'customerFirstName' | 'customerLastName'>,
  unknownLabel: string,
): string {
  const name = [order.customerFirstName, order.customerLastName].filter(Boolean).join(' ').trim();
  return name || unknownLabel;
}

export function hasLoadedOrderDetails(
  details: { items?: unknown[] } | null | undefined,
): boolean {
  return Array.isArray(details?.items);
}

/** Sheet still loading full detail API response. */
export function isOrderSheetLoadingDetails(
  loading: boolean,
  orderDetails: { items?: unknown[] } | null | undefined,
): boolean {
  return loading && !hasLoadedOrderDetails(orderDetails);
}

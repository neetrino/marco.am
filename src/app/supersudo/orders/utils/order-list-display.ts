import {
  coerceCurrencyCode,
  convertPrice,
  type CurrencyCode,
} from '@/lib/currency';
import type { Order } from '../useOrders';

type OrderListTotalInput = Pick<
  Order,
  'subtotal' | 'discountAmount' | 'taxAmount' | 'total' | 'shippingAmount' | 'currency'
>;

/** Order money fields are stored in `order.currency` (checkout writes AMD). */
function toAmd(amount: number, orderCurrency: string | undefined): number {
  const stored = coerceCurrencyCode(orderCurrency, 'AMD');
  if (stored === 'AMD') {
    return amount;
  }
  return convertPrice(amount, stored, 'AMD');
}

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
    const subtotalAmd = toAmd(order.subtotal, order.currency);
    const discountAmd = toAmd(order.discountAmount, order.currency);
    const taxAmd = toAmd(order.taxAmount, order.currency);
    const totalWithoutShippingAmd = subtotalAmd - discountAmd + taxAmd;
    return formatCurrency(totalWithoutShippingAmd, order.currency, 'AMD');
  }

  const totalAmd = toAmd(order.total, order.currency);
  const shippingAmd = toAmd(order.shippingAmount || 0, order.currency);
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

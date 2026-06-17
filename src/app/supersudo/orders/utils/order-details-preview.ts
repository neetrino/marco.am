import { hasLoadedOrderDetails } from './order-list-display';

/** Sheet still loading full detail API response. */
export function isOrderSheetLoadingDetails(
  loading: boolean,
  orderDetails: { items?: unknown[] } | null | undefined,
): boolean {
  return loading && !hasLoadedOrderDetails(orderDetails);
}

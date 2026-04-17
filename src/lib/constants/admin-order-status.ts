/**
 * Order workflow statuses allowed for admin updates (`admin-orders/order-mutations`).
 * Used for analytics breakdown so buckets stay aligned with the order list filters.
 */
export const ADMIN_ORDER_STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
] as const;

export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number];

const STATUS_SET = new Set<string>(ADMIN_ORDER_STATUSES);

export function isAdminOrderStatus(value: string): value is AdminOrderStatus {
  return STATUS_SET.has(value);
}

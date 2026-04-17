import type { AdminOrderListStatus } from "@/lib/constants/admin-order-list-status";

/** i18n keys for list filter + row status (New, In process, Delivered, Canceled). */
export const ADMIN_ORDER_STATUS_I18N_KEY: Record<
  AdminOrderListStatus,
  string
> = {
  pending: "admin.orders.statusNew",
  processing: "admin.orders.statusInProcess",
  completed: "admin.orders.statusDelivered",
  cancelled: "admin.orders.statusCanceled",
};

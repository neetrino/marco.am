/** Base path for authenticated customer order APIs (JWT). */
const CUSTOMER_ORDER_API_PREFIX = "/api/v1/orders" as const;

type CustomerOrderHttpMethod = "GET" | "POST";

export type CustomerOrderLink = {
  method: CustomerOrderHttpMethod;
  href: string;
};

export type CustomerOrderLinks = {
  /** GET this order (same resource as the list row). */
  self: CustomerOrderLink;
  /** POST to merge line items into the user cart (reorder). */
  reorder: CustomerOrderLink;
};

export function customerOrderDetailPath(orderNumber: string): string {
  return `${CUSTOMER_ORDER_API_PREFIX}/${encodeURIComponent(orderNumber)}`;
}

export function customerOrderReorderPath(orderNumber: string): string {
  return `${customerOrderDetailPath(orderNumber)}/reorder`;
}

/**
 * Stable link objects for order history and order detail responses.
 */
export function buildCustomerOrderLinks(orderNumber: string): CustomerOrderLinks {
  return {
    self: { method: "GET", href: customerOrderDetailPath(orderNumber) },
    reorder: { method: "POST", href: customerOrderReorderPath(orderNumber) },
  };
}

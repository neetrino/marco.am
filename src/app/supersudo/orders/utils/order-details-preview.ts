import type { Order, OrderDetails } from '../useOrders';

/** Instant preview from list row while full detail loads. */
export function buildOrderDetailsPreviewFromList(order: Order): OrderDetails {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total,
    currency: order.currency,
    totals: {
      subtotal: Number(order.subtotal ?? 0),
      discount: Number(order.discountAmount ?? 0),
      shipping: Number(order.shippingAmount ?? 0),
      tax: Number(order.taxAmount ?? 0),
      total: order.total,
      currency: order.currency,
    },
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    customer: order.customerId
      ? {
          id: order.customerId,
          email: order.customerEmail || null,
          phone: order.customerPhone || null,
          firstName: order.customerFirstName ?? null,
          lastName: order.customerLastName ?? null,
        }
      : null,
    items: [],
    createdAt: order.createdAt,
  };
}

export function isOrderDetailsPreview(details: OrderDetails): boolean {
  return details.items.length === 0;
}

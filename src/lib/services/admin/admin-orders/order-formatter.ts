import type { Prisma } from "@white-shop/db/prisma";

type OrderItemVariantOption = {
  attributeKey?: string;
  value?: string;
  label?: string;
  imageUrl?: string;
  colors?: unknown;
};

/** Parses checkout snapshot e.g. "color: Red, size: M" into display options. */
export function parseVariantTitleOptions(
  variantTitle: string | null | undefined,
): OrderItemVariantOption[] {
  if (!variantTitle?.trim()) {
    return [];
  }

  const options: OrderItemVariantOption[] = [];

  for (const part of variantTitle.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) {
      options.push({ value: trimmed, label: trimmed });
      continue;
    }

    const attributeKey = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    if (!attributeKey && !value) {
      continue;
    }

    options.push({
      attributeKey: attributeKey || undefined,
      value: value || undefined,
      label: value || attributeKey || undefined,
    });
  }

  return options;
}

/**
 * Format order for list response
 */
export function formatOrderForList(order: {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  currency: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  createdAt: Date;
  items?: Array<unknown>;
  _count?: { items: number };
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}) {
  const customer = order.user || null;
  const firstName = customer?.firstName || '';
  const lastName = customer?.lastName || '';

  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    shippingAmount: order.shippingAmount,
    taxAmount: order.taxAmount,
    currency: order.currency || 'AMD',
    customerEmail: customer?.email || order.customerEmail || '',
    customerPhone: customer?.phone || order.customerPhone || '',
    customerFirstName: firstName,
    customerLastName: lastName,
    customerId: customer?.id || null,
    itemsCount: order._count?.items ?? order.items?.length ?? 0,
    createdAt: order.createdAt.toISOString(),
  };
}

/**
 * Format order item for detail response — uses OrderItem snapshot fields only.
 */
export function formatOrderItem(item: {
  id: string;
  variantId: string | null;
  productTitle: string | null;
  variantTitle?: string | null;
  sku: string | null;
  quantity: number | null;
  total: number | null;
  price: number | null;
  imageUrl?: string | null;
}) {
  const quantity = item.quantity ?? 0;
  const total = item.total ?? 0;
  const unitPrice =
    item.price != null && !Number.isNaN(Number(item.price))
      ? Number(item.price)
      : quantity > 0
        ? Number((total / quantity).toFixed(2))
        : total;

  return {
    id: item.id,
    variantId: item.variantId || null,
    productId: null,
    productTitle: item.productTitle || "Unknown Product",
    sku: item.sku || "N/A",
    quantity,
    total,
    unitPrice,
    imageUrl: item.imageUrl?.trim() || undefined,
    variantOptions: parseVariantTitleOptions(item.variantTitle),
  };
}

/**
 * Format order for detail response
 */
export function formatOrderForDetail(order: {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  subtotal: number | null;
  discountAmount: number | null;
  shippingAmount: number | null;
  taxAmount: number | null;
  currency: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  billingAddress: Prisma.JsonValue | null;
  shippingAddress: Prisma.JsonValue | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  notes: string | null;
  adminNotes: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  fulfilledAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  items: Array<{
    id: string;
    variantId: string | null;
    productTitle: string | null;
    variantTitle?: string | null;
    sku: string | null;
    quantity: number | null;
    total: number | null;
    price: number | null;
    imageUrl?: string | null;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    method: string | null;
    amount: number;
    currency: string;
    status: string;
    cardLast4: string | null;
    cardBrand: string | null;
  }>;
}) {
  const user = order.user;
  const payments = Array.isArray(order.payments) ? order.payments : [];
  const primaryPayment = payments[0] || null;
  const formattedItems = order.items.map(formatOrderItem);

  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total,
    currency: order.currency || "AMD",
    totals: {
      subtotal: Number(order.subtotal || 0),
      discount: Number(order.discountAmount || 0),
      shipping: Number(order.shippingAmount || 0),
      tax: Number(order.taxAmount || 0),
      total: Number(order.total || 0),
      currency: order.currency || "AMD",
    },
    customerEmail: order.customerEmail || user?.email || undefined,
    customerPhone: order.customerPhone || user?.phone || undefined,
    billingAddress: order.billingAddress || null,
    shippingAddress: order.shippingAddress || null,
    shippingMethod: order.shippingMethod || null,
    trackingNumber: order.trackingNumber?.trim() || null,
    notes: order.notes || null,
    adminNotes: order.adminNotes || null,
    ipAddress: order.ipAddress || null,
    userAgent: order.userAgent || null,
    payment: primaryPayment
      ? {
          id: primaryPayment.id,
          provider: primaryPayment.provider,
          method: primaryPayment.method ?? "",
          amount: primaryPayment.amount,
          currency: primaryPayment.currency,
          status: primaryPayment.status,
          cardLast4: primaryPayment.cardLast4,
          cardBrand: primaryPayment.cardBrand,
        }
      : null,
    customer: user
      ? {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt?.toISOString?.() ?? undefined,
    fulfilledAt: order.fulfilledAt?.toISOString?.() ?? undefined,
    items: formattedItems,
  };
}


import { db } from "@white-shop/db";
import { logger } from "../../../utils/logger";
import type { OrderFilters } from "./types";
import { buildOrderWhereClause, buildOrderByClause } from "./query-builder";
import { formatOrderForList, formatOrderForDetail } from "./order-formatter";
import { formatOrderAuditTrail } from "./order-audit-formatter";

/**
 * Get orders with filters and pagination
 */
export async function getOrders(filters: OrderFilters = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where = buildOrderWhereClause(filters);
  const orderBy = buildOrderByClause(filters);

  logger.debug('getOrders with filters', { where, page, limit, skip, orderBy });

  // Get orders with pagination, including related user for basic customer info
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        _count: { select: { items: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    db.order.count({ where }),
  ]);

  // Format orders for response
  const formattedOrders = orders.map(formatOrderForList);

  return {
    data: formattedOrders,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get single order by ID with full details for admin.
 * Uses OrderItem snapshot fields — no product/variant catalog joins.
 */
export async function getOrderById(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
        },
      },
      items: {
        select: {
          id: true,
          variantId: true,
          productTitle: true,
          variantTitle: true,
          sku: true,
          quantity: true,
          price: true,
          total: true,
          imageUrl: true,
        },
      },
      payments: {
        select: {
          id: true,
          provider: true,
          method: true,
          amount: true,
          currency: true,
          status: true,
          cardLast4: true,
          cardBrand: true,
        },
        orderBy: { createdAt: "asc" },
      },
      events: {
        select: {
          id: true,
          type: true,
          data: true,
          userId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Order not found",
      detail: `Order with id '${orderId}' does not exist`,
    };
  }

  const events = order.events ?? [];
  const actorIds = [
    ...new Set(
      events
        .map((e) => e.userId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  const actors =
    actorIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: actorIds } },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        })
      : [];
  const actorsById = Object.fromEntries(actors.map((a) => [a.id, a]));

  return {
    ...formatOrderForDetail(order),
    auditTrail: formatOrderAuditTrail(events, actorsById),
  };
}





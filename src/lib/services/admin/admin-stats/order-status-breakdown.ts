import { db } from "@white-shop/db";
import { isAdminOrderStatus } from "@/lib/constants/admin-order-status";
import { calculateDateRange } from "./analytics-date-range";

export type OrderStatusBreakdownByStatus = {
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  /** Counts for any `Order.status` value outside the known workflow set. */
  other: number;
};

export type OrderStatusBreakdownWindow = {
  period: "today" | "week" | "month";
  dateRange: {
    start: string;
    end: string;
  };
  byStatus: OrderStatusBreakdownByStatus;
  totalOrders: number;
};

/**
 * Response for `GET /api/v1/supersudo/analytics/order-status-breakdown` (admin analytics UI).
 */
export type OrderStatusBreakdownResponse = {
  windows: [OrderStatusBreakdownWindow, OrderStatusBreakdownWindow, OrderStatusBreakdownWindow];
};

function normalizeByStatus(raw: Record<string, number>): OrderStatusBreakdownByStatus {
  let other = 0;
  const pick = (k: string): number => raw[k] ?? 0;
  for (const [k, v] of Object.entries(raw)) {
    if (!isAdminOrderStatus(k)) {
      other += v;
    }
  }
  return {
    pending: pick("pending"),
    processing: pick("processing"),
    completed: pick("completed"),
    cancelled: pick("cancelled"),
    other,
  };
}

async function aggregateForPreset(
  period: "day" | "week" | "month",
  label: "today" | "week" | "month"
): Promise<OrderStatusBreakdownWindow> {
  const { start, end } = calculateDateRange(period);
  const grouped = await db.order.groupBy({
    by: ["status"],
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    _count: { _all: true },
  });

  const raw: Record<string, number> = {};
  let totalOrders = 0;
  for (const row of grouped) {
    const c = row._count._all;
    totalOrders += c;
    raw[row.status] = c;
  }

  return {
    period: label,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    byStatus: normalizeByStatus(raw),
    totalOrders,
  };
}

/**
 * Order counts by workflow status for today, last 7 days, and last 30 days (`Order.createdAt`).
 */
export async function getOrderStatusBreakdown(): Promise<OrderStatusBreakdownResponse> {
  const [today, week, month] = await Promise.all([
    aggregateForPreset("day", "today"),
    aggregateForPreset("week", "week"),
    aggregateForPreset("month", "month"),
  ]);
  return { windows: [today, week, month] };
}

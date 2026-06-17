import { db } from "@white-shop/db";

export type OrderSummaryStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
};

type OrderSummaryRow = {
  total_orders: bigint;
  paid_orders: bigint;
  pending_orders: bigint;
  completed_orders: bigint;
  total_revenue: number | null;
};

/** Order counts and paid revenue for a date window — single aggregate query. */
export async function getOrderSummaryStats(start: Date, end: Date): Promise<OrderSummaryStats> {
  const rows = await db.$queryRaw<OrderSummaryRow[]>`
    SELECT
      COUNT(*)::bigint AS total_orders,
      COUNT(*) FILTER (WHERE "paymentStatus" = 'paid')::bigint AS paid_orders,
      COUNT(*) FILTER (WHERE status = 'pending')::bigint AS pending_orders,
      COUNT(*) FILTER (WHERE status = 'completed')::bigint AS completed_orders,
      COALESCE(SUM(total) FILTER (WHERE "paymentStatus" = 'paid'), 0)::float AS total_revenue
    FROM orders
    WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
  `;

  const row = rows[0];
  const paidOrders = Number(row?.paid_orders ?? 0);
  const totalRevenue = Number(row?.total_revenue ?? 0);

  return {
    totalOrders: Number(row?.total_orders ?? 0),
    paidOrders,
    pendingOrders: Number(row?.pending_orders ?? 0),
    completedOrders: Number(row?.completed_orders ?? 0),
    totalRevenue,
    averageOrderValue: paidOrders > 0 ? totalRevenue / paidOrders : 0,
  };
}

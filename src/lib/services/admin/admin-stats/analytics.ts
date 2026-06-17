import { db } from "@white-shop/db";
import { calculateDateRange } from "./analytics-date-range";
import { getTopCategoryAnalytics } from "./analytics-category-sales";
import { getOrderSummaryStats } from "./analytics-order-stats";
import { getProductSalesAnalytics } from "./analytics-product-sales-query";
import { getCustomerAnalytics } from "./customer-analytics";

type OrdersByDayRow = {
  day: Date;
  count: bigint;
  revenue: number | null;
};

async function getOrdersByDay(start: Date, end: Date): Promise<Array<{ _id: string; count: number; revenue: number }>> {
  const rows = await db.$queryRaw<OrdersByDayRow[]>`
    SELECT
      date_trunc('day', "createdAt") AS day,
      COUNT(*)::bigint AS count,
      COALESCE(SUM(CASE WHEN "paymentStatus" = 'paid' THEN "total" ELSE 0 END), 0) AS revenue
    FROM orders
    WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  return rows.map((row) => ({
    _id: row.day.toISOString().split("T")[0],
    count: Number(row.count),
    revenue: Number(row.revenue ?? 0),
  }));
}

/**
 * Get analytics data — bounded SQL aggregates instead of loading all orders with joins.
 */
export async function getAnalytics(period: string = "week", startDate?: string, endDate?: string) {
  const { start, end } = calculateDateRange(period, startDate, endDate);

  const [
    orderStats,
    productSales,
    topCategories,
    customerAnalytics,
    ordersByDay,
    totalUsers,
  ] = await Promise.all([
    getOrderSummaryStats(start, end),
    getProductSalesAnalytics(start, end),
    getTopCategoryAnalytics(start, end),
    getCustomerAnalytics(start, end),
    getOrdersByDay(start, end),
    db.user.count({ where: { deletedAt: null } }),
  ]);

  return {
    period,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    orders: {
      totalOrders: orderStats.totalOrders,
      totalRevenue: orderStats.totalRevenue,
      averageOrderValue: orderStats.averageOrderValue,
      paidOrders: orderStats.paidOrders,
      pendingOrders: orderStats.pendingOrders,
      completedOrders: orderStats.completedOrders,
    },
    topProducts: productSales.bestSelling,
    leastSellingProducts: productSales.leastSelling,
    topCategories,
    ordersByDay,
    customerAnalytics,
    totalUsers,
  };
}

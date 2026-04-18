import { db } from "@white-shop/db";
import { calculateDateRange } from "./analytics-date-range";
import { getCustomerAnalytics } from "./customer-analytics";
import {
  aggregateProductSales,
  pickBestAndLeastSelling,
} from "./product-sales-analytics";

/**
 * Calculate top categories from orders
 */
function calculateTopCategories(orders: Array<{
  items: Array<{
    variant?: {
      product?: {
        categories: Array<{
          id: string;
          translations?: Array<{ title: string }>;
        }>;
      };
    };
    quantity: number;
    total: number;
  }>;
}>): Array<{
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}> {
  const categoryMap = new Map<string, {
    categoryId: string;
    categoryName: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
  }>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.variant?.product) {
        item.variant.product.categories.forEach((category) => {
          const categoryId = category.id;
          const translations = category.translations || [];
          const categoryName = translations[0]?.title || category.id;
          const existing = categoryMap.get(categoryId) || {
            categoryId,
            categoryName,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
          };
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += item.total;
          existing.orderCount += 1;
          categoryMap.set(categoryId, existing);
        });
      }
    });
  });

  return Array.from(categoryMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);
}

/**
 * Calculate orders by day
 */
function calculateOrdersByDay(orders: Array<{
  createdAt: Date;
  paymentStatus: string;
  total: number;
}>): Array<{
  _id: string;
  count: number;
  revenue: number;
}> {
  const ordersByDayMap = new Map<string, { count: number; revenue: number }>();

  orders.forEach((order) => {
    const dateKey = order.createdAt.toISOString().split('T')[0];
    const existing = ordersByDayMap.get(dateKey) || { count: 0, revenue: 0 };
    existing.count += 1;
    if (order.paymentStatus === 'paid') {
      existing.revenue += order.total;
    }
    ordersByDayMap.set(dateKey, existing);
  });

  return Array.from(ordersByDayMap.entries())
    .map(([date, data]) => ({
      _id: date,
      count: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => a._id.localeCompare(b._id));
}

/**
 * Get analytics data
 */
export async function getAnalytics(period: string = 'week', startDate?: string, endDate?: string) {
  const { start, end } = calculateDateRange(period, startDate, endDate);

  const [orders, customerAnalytics] = await Promise.all([
    db.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    translations: {
                      where: { locale: 'en' },
                      take: 1,
                    },
                    categories: {
                      include: {
                        translations: {
                          where: { locale: 'en' },
                          take: 1,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    getCustomerAnalytics(start, end),
  ]);

  // Calculate order statistics
  const totalOrders = orders.length;
  const paidOrdersList = orders.filter(
    (o: { paymentStatus: string }) => o.paymentStatus === 'paid'
  );
  const paidOrders = paidOrdersList.length;
  const pendingOrders = orders.filter((o: { status: string }) => o.status === 'pending').length;
  const completedOrders = orders.filter((o: { status: string }) => o.status === 'completed').length;
  const totalRevenue = paidOrdersList.reduce(
    (sum: number, o: { total: number }) => sum + o.total,
    0
  );
  const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

  const productRows = aggregateProductSales(orders);
  const { bestSelling, leastSelling } = pickBestAndLeastSelling(productRows);

  // Calculate top categories
  const topCategories = calculateTopCategories(orders as Parameters<typeof calculateTopCategories>[0]);

  // Calculate orders by day
  const ordersByDay = calculateOrdersByDay(orders);

  return {
    period,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    orders: {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      paidOrders,
      pendingOrders,
      completedOrders,
    },
    topProducts: bestSelling,
    leastSellingProducts: leastSelling,
    topCategories,
    ordersByDay,
    customerAnalytics,
  };
}





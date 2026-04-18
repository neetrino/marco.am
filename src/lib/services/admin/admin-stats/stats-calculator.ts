import { db } from "@white-shop/db";

import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/constants/low-stock-threshold";

interface SalesWindow {
  revenue: number;
  paidOrders: number;
  currency: string;
}

interface DashboardTopProduct {
  productId: string;
  title: string;
  totalQuantity: number;
  totalRevenue: number;
  currency: string;
}

function getStartOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getStartOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function getSalesWindow(start: Date, end: Date): Promise<SalesWindow> {
  const paidOrders = await db.order.findMany({
    where: {
      paymentStatus: "paid",
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      total: true,
      currency: true,
    },
  });

  return {
    revenue: paidOrders.reduce((sum, order) => sum + order.total, 0),
    paidOrders: paidOrders.length,
    currency: paidOrders[0]?.currency ?? "AMD",
  };
}

async function getTopProductForMonth(
  start: Date,
  end: Date
): Promise<DashboardTopProduct | null> {
  const paidOrderItems = await db.orderItem.findMany({
    where: {
      order: {
        paymentStatus: "paid",
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      variantId: {
        not: null,
      },
    },
    include: {
      order: {
        select: {
          currency: true,
        },
      },
      variant: {
        include: {
          product: {
            include: {
              translations: {
                where: { locale: "en" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const productTotals = new Map<string, DashboardTopProduct>();
  paidOrderItems.forEach((item) => {
    const variant = item.variant;
    const product = variant?.product;
    if (!variant || !product || product.deletedAt !== null) {
      return;
    }

    const current = productTotals.get(product.id) ?? {
      productId: product.id,
      title: product.translations[0]?.title ?? item.productTitle,
      totalQuantity: 0,
      totalRevenue: 0,
      currency: item.order.currency ?? "AMD",
    };

    current.totalQuantity += item.quantity;
    current.totalRevenue += item.total;
    productTotals.set(product.id, current);
  });

  const sorted = Array.from(productTotals.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );
  return sorted[0] ?? null;
}

/**
 * Get dashboard stats
 */
export async function getStats() {
  const now = new Date();
  const startOfToday = getStartOfToday(now);
  const startOfMonth = getStartOfMonth(now);

  // Count users
  const totalUsers = await db.user.count({
    where: { deletedAt: null },
  });

  // Count products
  const totalProducts = await db.product.count({
    where: { deletedAt: null },
  });

  // Count variants with low stock (stock < threshold), published only; includes out-of-stock (0)
  const lowStockProducts = await db.productVariant.count({
    where: {
      stock: { lt: DEFAULT_LOW_STOCK_THRESHOLD },
      published: true,
    },
  });

  // Count orders
  const totalOrders = await db.order.count();

  // Count recent orders (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentOrders = await db.order.count({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
  });

  // Count pending orders
  const pendingOrders = await db.order.count({
    where: { status: "pending" },
  });

  // Calculate total revenue from completed/paid orders
  const completedOrPaidOrders = await db.order.findMany({
    where: {
      OR: [
        { status: "completed" },
        { paymentStatus: "paid" },
      ],
    },
    select: {
      total: true,
      currency: true,
    },
  });

  const totalRevenue = completedOrPaidOrders.reduce(
    (sum: number, order: { total: number; currency: string | null }) =>
      sum + order.total,
    0
  );
  const currency = completedOrPaidOrders[0]?.currency || "AMD";

  const [todaySales, monthlySales, topProduct] = await Promise.all([
    getSalesWindow(startOfToday, now),
    getSalesWindow(startOfMonth, now),
    getTopProductForMonth(startOfMonth, now),
  ]);

  return {
    users: {
      total: totalUsers,
    },
    products: {
      total: totalProducts,
      lowStock: lowStockProducts,
    },
    orders: {
      total: totalOrders,
      recent: recentOrders,
      pending: pendingOrders,
    },
    revenue: {
      total: totalRevenue,
      currency,
    },
    salesWidgets: {
      todaySales,
      monthlySales,
      topProduct,
    },
  };
}





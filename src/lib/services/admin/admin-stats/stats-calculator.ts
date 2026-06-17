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

const TOP_VARIANT_GROUPS_FOR_PRODUCT = 50;

function getStartOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getStartOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function getSalesWindow(start: Date, end: Date): Promise<SalesWindow> {
  const [paidOrdersCount, aggregate] = await Promise.all([
    db.order.count({
      where: {
        paymentStatus: "paid",
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    }),
    db.order.aggregate({
      where: {
        paymentStatus: "paid",
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        total: true,
      },
      _max: {
        currency: true,
      },
    }),
  ]);

  return {
    revenue: aggregate._sum.total ?? 0,
    paidOrders: paidOrdersCount,
    currency: aggregate._max.currency ?? "AMD",
  };
}

async function getTopProductForMonth(
  start: Date,
  end: Date,
): Promise<DashboardTopProduct | null> {
  const variantGroups = await db.orderItem.groupBy({
    by: ["variantId"],
    where: {
      variantId: { not: null },
      order: {
        paymentStatus: "paid",
        createdAt: { gte: start, lte: end },
      },
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take: TOP_VARIANT_GROUPS_FOR_PRODUCT,
  });

  if (variantGroups.length === 0) {
    return null;
  }

  const variantIds = variantGroups
    .map((group) => group.variantId)
    .filter((id): id is string => id !== null);

  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: {
        include: {
          translations: { where: { locale: "en" }, take: 1 },
        },
      },
    },
  });

  const variantById = new Map(variants.map((variant) => [variant.id, variant]));
  const productTotals = new Map<string, DashboardTopProduct>();

  for (const group of variantGroups) {
    if (!group.variantId) {
      continue;
    }
    const variant = variantById.get(group.variantId);
    const product = variant?.product;
    if (!product || product.deletedAt !== null) {
      continue;
    }

    const current = productTotals.get(product.id) ?? {
      productId: product.id,
      title: product.translations[0]?.title ?? "Unknown",
      totalQuantity: 0,
      totalRevenue: 0,
      currency: "AMD",
    };

    current.totalQuantity += group._sum.quantity ?? 0;
    current.totalRevenue += group._sum.total ?? 0;
    productTotals.set(product.id, current);
  }

  const sorted = Array.from(productTotals.values()).sort(
    (left, right) => right.totalRevenue - left.totalRevenue,
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
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    totalProducts,
    lowStockProducts,
    totalOrders,
    recentOrders,
    pendingOrders,
    revenueAgg,
    todaySales,
    monthlySales,
    topProduct,
  ] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.product.count({ where: { deletedAt: null } }),
    db.productVariant.count({
      where: {
        stock: { lt: DEFAULT_LOW_STOCK_THRESHOLD },
        published: true,
      },
    }),
    db.order.count(),
    db.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.order.count({ where: { status: "pending" } }),
    db.order.aggregate({
      where: {
        OR: [{ status: "completed" }, { paymentStatus: "paid" }],
      },
      _sum: { total: true },
      _max: { currency: true },
    }),
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
      total: revenueAgg._sum.total ?? 0,
      currency: revenueAgg._max.currency ?? "AMD",
    },
    salesWidgets: {
      todaySales,
      monthlySales,
      topProduct,
    },
  };
}

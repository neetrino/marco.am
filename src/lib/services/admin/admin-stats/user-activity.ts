import { db } from "@white-shop/db";

/**
 * Format user for activity response
 */
function formatUser(user: {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email || undefined,
    phone: user.phone || undefined,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || user.phone || "Unknown",
    registeredAt: user.createdAt.toISOString(),
    lastLoginAt: undefined,
  };
}

function formatUserName(user: {
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || user.phone || "Unknown";
}

/**
 * Get user activity (recent registrations and active users)
 */
export async function getUserActivity(limit: number = 10) {
  const recentUsers = await db.user.findMany({
    where: { deletedAt: null },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });

  const recentRegistrations = recentUsers.map(formatUser);

  const topUsers = await db.user.findMany({
    where: {
      deletedAt: null,
      orders: { some: {} },
    },
    take: limit,
    orderBy: {
      orders: { _count: "desc" },
    },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      _count: { select: { orders: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const userIds = topUsers.map((user) => user.id);
  const spendByUserId = new Map<string, number>();

  if (userIds.length > 0) {
    const spendRows = await db.order.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _sum: { total: true },
    });
    for (const row of spendRows) {
      if (row.userId) {
        spendByUserId.set(row.userId, row._sum?.total ?? 0);
      }
    }
  }

  const activeUsers = topUsers.map((user) => ({
    id: user.id,
    email: user.email || undefined,
    phone: user.phone || undefined,
    name: formatUserName(user),
    orderCount: user._count.orders,
    totalSpent: spendByUserId.get(user.id) ?? 0,
    lastOrderDate: user.orders[0]?.createdAt.toISOString() ?? user.createdAt.toISOString(),
    lastLoginAt: undefined,
  }));

  return {
    recentRegistrations,
    activeUsers,
  };
}

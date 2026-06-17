import { db } from "@white-shop/db";

import { TOP_CUSTOMERS_BY_SPEND_LIMIT } from "@/lib/constants/customer-analytics";

import { buildCustomerIdentityKey } from "./customer-identity";

export type NewVsRepeatAnalytics = {
  /** Distinct customers (user or guest email) whose first order ever falls in the period. */
  newCustomers: number;
  /** Distinct customers who ordered in the period and had an order before the period start. */
  repeatCustomers: number;
  /** Orders in period from new customers (same customer may contribute multiple). */
  ordersFromNewCustomers: number;
  ordersFromRepeatCustomers: number;
  /** Orders in period with no userId and no email — excluded from new/repeat split. */
  ordersUnattributed: number;
};

export type TopCustomerBySpendRow = {
  identityType: "user" | "email";
  userId: string | null;
  email: string | null;
  displayName: string;
  totalSpend: number;
  orderCount: number;
  currency: string;
};

export type CustomerAnalyticsBlock = {
  newVsRepeat: NewVsRepeatAnalytics;
  topCustomersBySpend: TopCustomerBySpendRow[];
};

function buildFirstOrderAtMap(): Promise<Map<string, Date>> {
  return db
    .$queryRaw<Array<{ identity_key: string; first_at: Date }>>`
      SELECT identity_key, MIN("createdAt") AS first_at
      FROM (
        SELECT
          CASE
            WHEN "userId" IS NOT NULL AND btrim("userId") <> '' THEN 'user:' || "userId"
            WHEN "customerEmail" IS NOT NULL AND btrim("customerEmail") <> ''
              THEN 'email:' || lower(btrim("customerEmail"))
          END AS identity_key,
          "createdAt"
        FROM orders
        WHERE ("userId" IS NOT NULL AND btrim("userId") <> '')
           OR ("customerEmail" IS NOT NULL AND btrim("customerEmail") <> '')
      ) AS attributed
      WHERE identity_key IS NOT NULL
      GROUP BY identity_key
    `
    .then((rows) => {
      const firstOrderAt = new Map<string, Date>();
      for (const row of rows) {
        firstOrderAt.set(row.identity_key, row.first_at);
      }
      return firstOrderAt;
    });
}

/**
 * Customer analytics for the given window: new vs repeat (by first order ever),
 * and top customers by paid spend in the window.
 */
export async function getCustomerAnalytics(
  start: Date,
  end: Date
): Promise<CustomerAnalyticsBlock> {
  const [firstOrderAt, periodOrders] = await Promise.all([
    buildFirstOrderAtMap(),
    db.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        userId: true,
        customerEmail: true,
        total: true,
        paymentStatus: true,
        currency: true,
      },
    }),
  ]);

  const newCustomerKeys = new Set<string>();
  const repeatCustomerKeys = new Set<string>();
  let ordersFromNewCustomers = 0;
  let ordersFromRepeatCustomers = 0;
  let ordersUnattributed = 0;

  const spendByKey = new Map<
    string,
    { totalSpend: number; orderCount: number; currency: string }
  >();

  for (const order of periodOrders) {
    const key = buildCustomerIdentityKey(order.userId, order.customerEmail);
    if (!key) {
      ordersUnattributed += 1;
      continue;
    }

    const firstAt = firstOrderAt.get(key);
    if (!firstAt) {
      ordersUnattributed += 1;
      continue;
    }

    const isNewInPeriod = firstAt >= start && firstAt <= end;
    if (isNewInPeriod) {
      newCustomerKeys.add(key);
      ordersFromNewCustomers += 1;
    } else {
      repeatCustomerKeys.add(key);
      ordersFromRepeatCustomers += 1;
    }

    if (order.paymentStatus === "paid") {
      const existing = spendByKey.get(key);
      const currency = order.currency || "AMD";
      if (existing) {
        existing.totalSpend += order.total;
        existing.orderCount += 1;
        existing.currency = currency;
      } else {
        spendByKey.set(key, {
          totalSpend: order.total,
          orderCount: 1,
          currency,
        });
      }
    }
  }

  const sortedSpendKeys = Array.from(spendByKey.entries())
    .sort((a, b) => b[1].totalSpend - a[1].totalSpend)
    .slice(0, TOP_CUSTOMERS_BY_SPEND_LIMIT);

  const userIds = sortedSpendKeys
    .filter(([k]) => k.startsWith("user:"))
    .map(([k]) => k.slice("user:".length));

  const users =
    userIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        })
      : [];

  const userById = new Map(users.map((u) => [u.id, u]));

  const topCustomersBySpend: TopCustomerBySpendRow[] = sortedSpendKeys.map(
    ([key, agg]) => {
      if (key.startsWith("user:")) {
        const id = key.slice("user:".length);
        const u = userById.get(id);
        const namePart = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
        const displayName =
          namePart.length > 0 ? namePart : u?.email ?? id;
        return {
          identityType: "user" as const,
          userId: id,
          email: u?.email ?? null,
          displayName,
          totalSpend: agg.totalSpend,
          orderCount: agg.orderCount,
          currency: agg.currency,
        };
      }

      const emailAddr = key.slice("email:".length);
      return {
        identityType: "email" as const,
        userId: null,
        email: emailAddr,
        displayName: emailAddr,
        totalSpend: agg.totalSpend,
        orderCount: agg.orderCount,
        currency: agg.currency,
      };
    }
  );

  return {
    newVsRepeat: {
      newCustomers: newCustomerKeys.size,
      repeatCustomers: repeatCustomerKeys.size,
      ordersFromNewCustomers,
      ordersFromRepeatCustomers,
      ordersUnattributed,
    },
    topCustomersBySpend,
  };
}

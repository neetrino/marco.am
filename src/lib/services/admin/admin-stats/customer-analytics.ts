import { db } from "@white-shop/db";

import { TOP_CUSTOMERS_BY_SPEND_LIMIT } from "@/lib/constants/customer-analytics";

type NewVsRepeatAnalytics = {
  newCustomers: number;
  repeatCustomers: number;
  ordersFromNewCustomers: number;
  ordersFromRepeatCustomers: number;
  ordersUnattributed: number;
};

type TopCustomerBySpendRow = {
  identityType: "user" | "email";
  userId: string | null;
  email: string | null;
  displayName: string;
  totalSpend: number;
  orderCount: number;
  currency: string;
};

type CustomerAnalyticsBlock = {
  newVsRepeat: NewVsRepeatAnalytics;
  topCustomersBySpend: TopCustomerBySpendRow[];
};

type PeriodStatsRow = {
  new_customers: number;
  repeat_customers: number;
  orders_from_new: number;
  orders_from_repeat: number;
  orders_unattributed: number;
};

type TopSpenderRow = {
  identity_key: string;
  total_spend: number;
  order_count: number;
  currency: string;
};

async function queryPeriodCustomerStats(start: Date, end: Date): Promise<NewVsRepeatAnalytics> {
  const rows = await db.$queryRaw<PeriodStatsRow[]>`
    WITH first_orders AS (
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
    ),
    period_orders AS (
      SELECT
        CASE
          WHEN "userId" IS NOT NULL AND btrim("userId") <> '' THEN 'user:' || "userId"
          WHEN "customerEmail" IS NOT NULL AND btrim("customerEmail") <> ''
            THEN 'email:' || lower(btrim("customerEmail"))
        END AS identity_key
      FROM orders
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
    ),
    classified AS (
      SELECT
        po.identity_key,
        fo.first_at
      FROM period_orders po
      LEFT JOIN first_orders fo ON fo.identity_key = po.identity_key
    )
    SELECT
      COUNT(DISTINCT identity_key) FILTER (
        WHERE identity_key IS NOT NULL AND first_at >= ${start} AND first_at <= ${end}
      )::int AS new_customers,
      COUNT(DISTINCT identity_key) FILTER (
        WHERE identity_key IS NOT NULL AND first_at IS NOT NULL AND first_at < ${start}
      )::int AS repeat_customers,
      COUNT(*) FILTER (
        WHERE identity_key IS NOT NULL AND first_at >= ${start} AND first_at <= ${end}
      )::int AS orders_from_new,
      COUNT(*) FILTER (
        WHERE identity_key IS NOT NULL AND first_at IS NOT NULL AND first_at < ${start}
      )::int AS orders_from_repeat,
      COUNT(*) FILTER (WHERE identity_key IS NULL OR first_at IS NULL)::int AS orders_unattributed
    FROM classified
  `;

  const row = rows[0];
  return {
    newCustomers: row?.new_customers ?? 0,
    repeatCustomers: row?.repeat_customers ?? 0,
    ordersFromNewCustomers: row?.orders_from_new ?? 0,
    ordersFromRepeatCustomers: row?.orders_from_repeat ?? 0,
    ordersUnattributed: row?.orders_unattributed ?? 0,
  };
}

async function queryTopCustomersBySpend(
  start: Date,
  end: Date,
  limit: number,
): Promise<TopSpenderRow[]> {
  return db.$queryRaw<TopSpenderRow[]>`
    SELECT
      identity_key,
      SUM(total)::float AS total_spend,
      COUNT(*)::int AS order_count,
      MAX(currency) AS currency
    FROM (
      SELECT
        CASE
          WHEN "userId" IS NOT NULL AND btrim("userId") <> '' THEN 'user:' || "userId"
          WHEN "customerEmail" IS NOT NULL AND btrim("customerEmail") <> ''
            THEN 'email:' || lower(btrim("customerEmail"))
        END AS identity_key,
        total,
        currency
      FROM orders
      WHERE "createdAt" >= ${start}
        AND "createdAt" <= ${end}
        AND "paymentStatus" = 'paid'
        AND (
          ("userId" IS NOT NULL AND btrim("userId") <> '')
          OR ("customerEmail" IS NOT NULL AND btrim("customerEmail") <> '')
        )
    ) AS paid_orders
    WHERE identity_key IS NOT NULL
    GROUP BY identity_key
    ORDER BY total_spend DESC
    LIMIT ${limit}
  `;
}

/**
 * Customer analytics for the given window: new vs repeat (by first order ever),
 * and top customers by paid spend in the window.
 */
export async function getCustomerAnalytics(
  start: Date,
  end: Date,
): Promise<CustomerAnalyticsBlock> {
  const [newVsRepeat, topSpenderRows] = await Promise.all([
    queryPeriodCustomerStats(start, end),
    queryTopCustomersBySpend(start, end, TOP_CUSTOMERS_BY_SPEND_LIMIT),
  ]);

  const userIds = topSpenderRows
    .filter((row) => row.identity_key.startsWith("user:"))
    .map((row) => row.identity_key.slice("user:".length));

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

  const userById = new Map(users.map((user) => [user.id, user]));

  const topCustomersBySpend: TopCustomerBySpendRow[] = topSpenderRows.map((row) => {
    if (row.identity_key.startsWith("user:")) {
      const id = row.identity_key.slice("user:".length);
      const user = userById.get(id);
      const namePart = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
      const displayName = namePart.length > 0 ? namePart : user?.email ?? id;
      return {
        identityType: "user" as const,
        userId: id,
        email: user?.email ?? null,
        displayName,
        totalSpend: row.total_spend,
        orderCount: row.order_count,
        currency: row.currency || "AMD",
      };
    }

    const emailAddr = row.identity_key.slice("email:".length);
    return {
      identityType: "email" as const,
      userId: null,
      email: emailAddr,
      displayName: emailAddr,
      totalSpend: row.total_spend,
      orderCount: row.order_count,
      currency: row.currency || "AMD",
    };
  });

  return {
    newVsRepeat,
    topCustomersBySpend,
  };
}

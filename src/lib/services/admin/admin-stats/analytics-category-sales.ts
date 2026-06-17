import { db } from "@white-shop/db";

export type TopCategoryAnalyticsRow = {
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
};

type TopCategoryAggregateRow = {
  category_id: string;
  category_name: string;
  total_quantity: bigint;
  total_revenue: number;
  order_count: bigint;
};

const TOP_CATEGORY_LIMIT = 10;
const DEFAULT_LOCALE = "en";

/** Top categories by revenue in period — SQL aggregation via product-category join. */
export async function getTopCategoryAnalytics(
  start: Date,
  end: Date,
  locale: string = DEFAULT_LOCALE,
): Promise<TopCategoryAnalyticsRow[]> {
  const rows = await db.$queryRaw<TopCategoryAggregateRow[]>`
    SELECT
      c.id AS category_id,
      COALESCE(ct.title, c.id) AS category_name,
      SUM(oi.quantity)::bigint AS total_quantity,
      SUM(oi.total)::float AS total_revenue,
      COUNT(*)::bigint AS order_count
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi."orderId"
    INNER JOIN product_variants pv ON pv.id = oi."variantId"
    INNER JOIN products p ON p.id = pv."productId"
    INNER JOIN "_ProductCategories" pc ON pc."B" = p.id
    INNER JOIN categories c ON c.id = pc."A"
    LEFT JOIN category_translations ct
      ON ct."categoryId" = c.id AND ct.locale = ${locale}
    WHERE o."createdAt" >= ${start}
      AND o."createdAt" <= ${end}
      AND c."deletedAt" IS NULL
    GROUP BY c.id, ct.title
    ORDER BY total_revenue DESC
    LIMIT ${TOP_CATEGORY_LIMIT}
  `;

  return rows.map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    totalQuantity: Number(row.total_quantity),
    totalRevenue: Number(row.total_revenue),
    orderCount: Number(row.order_count),
  }));
}

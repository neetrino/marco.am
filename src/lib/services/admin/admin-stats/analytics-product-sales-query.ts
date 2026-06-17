import { db } from "@white-shop/db";
import { PRODUCT_ANALYTICS_RANK_LIMIT, MULTIPLE_SKUS_LABEL } from "@/lib/constants/product-analytics";
import { extractImageFromMedia } from "./top-products";
import {
  pickBestAndLeastSelling,
  type ProductSaleAnalyticsRow,
} from "./product-sales-analytics";

type ProductSalesAggregateRow = {
  product_id: string;
  title: string;
  skus: string[];
  total_quantity: bigint;
  total_revenue: number;
  order_count: bigint;
};

const DEFAULT_LOCALE = "en";

function mapSkuLabel(skus: string[]): string {
  const normalized = skus.filter((sku) => sku.length > 0);
  if (normalized.length === 0) {
    return "N/A";
  }
  if (normalized.length === 1) {
    return normalized[0] ?? "N/A";
  }
  return MULTIPLE_SKUS_LABEL;
}

async function attachProductImages(rows: ProductSaleAnalyticsRow[]): Promise<void> {
  const productIds = [...new Set(rows.map((row) => row.productId))];
  if (productIds.length === 0) {
    return;
  }

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, media: true },
  });

  const imageByProductId = new Map(
    products.map((product) => [
      product.id,
      extractImageFromMedia(Array.isArray(product.media) ? product.media : undefined),
    ]),
  );

  for (const row of rows) {
    if (!row.image) {
      row.image = imageByProductId.get(row.productId) ?? null;
    }
  }
}

async function queryProductSalesRows(
  start: Date,
  end: Date,
  locale: string,
): Promise<ProductSaleAnalyticsRow[]> {
  const rows = await db.$queryRaw<ProductSalesAggregateRow[]>`
    SELECT
      p.id AS product_id,
      COALESCE(pt.title, oi."productTitle", 'Unknown Product') AS title,
      array_agg(DISTINCT COALESCE(NULLIF(oi.sku, ''), pv.sku, 'N/A')) AS skus,
      SUM(oi.quantity)::bigint AS total_quantity,
      SUM(oi.total)::float AS total_revenue,
      COUNT(*)::bigint AS order_count
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi."orderId"
    INNER JOIN product_variants pv ON pv.id = oi."variantId"
    INNER JOIN products p ON p.id = pv."productId"
    LEFT JOIN product_translations pt
      ON pt."productId" = p.id AND pt.locale = ${locale}
    WHERE o."createdAt" >= ${start}
      AND o."createdAt" <= ${end}
      AND p."deletedAt" IS NULL
    GROUP BY p.id, pt.title, oi."productTitle"
  `;

  return rows.map((row) => ({
    productId: row.product_id,
    title: row.title,
    sku: mapSkuLabel(row.skus ?? []),
    totalQuantity: Number(row.total_quantity),
    totalRevenue: Number(row.total_revenue),
    orderCount: Number(row.order_count),
    image: null,
  }));
}

/** Best / least selling products for a period — aggregated in SQL. */
export async function getProductSalesAnalytics(
  start: Date,
  end: Date,
  locale: string = DEFAULT_LOCALE,
): Promise<{
  bestSelling: ProductSaleAnalyticsRow[];
  leastSelling: ProductSaleAnalyticsRow[];
}> {
  const rows = await queryProductSalesRows(start, end, locale);
  const { bestSelling, leastSelling } = pickBestAndLeastSelling(
    rows,
    PRODUCT_ANALYTICS_RANK_LIMIT,
  );
  await attachProductImages([...bestSelling, ...leastSelling]);
  return { bestSelling, leastSelling };
}

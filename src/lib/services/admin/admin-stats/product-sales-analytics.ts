import { PRODUCT_ANALYTICS_RANK_LIMIT } from "@/lib/constants/product-analytics";

export type ProductSaleAnalyticsRow = {
  productId: string;
  title: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  image?: string | null;
};

/**
 * Top N by sold quantity and bottom N among the rest (no overlap with top N).
 */
export function pickBestAndLeastSelling(
  rows: ProductSaleAnalyticsRow[],
  limit: number = PRODUCT_ANALYTICS_RANK_LIMIT,
): { bestSelling: ProductSaleAnalyticsRow[]; leastSelling: ProductSaleAnalyticsRow[] } {
  const sortedDesc = [...rows].sort((a, b) => {
    if (b.totalQuantity !== a.totalQuantity) {
      return b.totalQuantity - a.totalQuantity;
    }
    return a.productId.localeCompare(b.productId);
  });
  const bestSelling = sortedDesc.slice(0, limit);
  const bestIds = new Set(bestSelling.map((r) => r.productId));
  const leastPool = rows
    .filter((r) => !bestIds.has(r.productId))
    .sort((a, b) => {
      if (a.totalQuantity !== b.totalQuantity) {
        return a.totalQuantity - b.totalQuantity;
      }
      return a.productId.localeCompare(b.productId);
    });
  const leastSelling = leastPool.slice(0, limit);
  return { bestSelling, leastSelling };
}

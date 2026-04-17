import {
  MULTIPLE_SKUS_LABEL,
  PRODUCT_ANALYTICS_RANK_LIMIT,
} from "@/lib/constants/product-analytics";

import { extractImageFromMedia } from "./top-products";

type OrderItemForProductSales = {
  productTitle: string;
  sku: string;
  quantity: number;
  total: number;
  imageUrl: string | null;
  variantId: string | null;
  variant?: {
    sku: string | null;
    product?: {
      id: string;
      media?: unknown;
      translations?: Array<{ title: string }>;
    } | null;
  } | null;
};

type OrderForProductSales = {
  items: OrderItemForProductSales[];
};

export type ProductSaleAnalyticsRow = {
  productId: string;
  title: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  image?: string | null;
};

function resolveItemImage(item: OrderItemForProductSales): string | null {
  if (item.imageUrl) {
    return item.imageUrl;
  }
  const media = item.variant?.product?.media;
  return extractImageFromMedia(Array.isArray(media) ? media : undefined);
}

function resolveSku(item: OrderItemForProductSales): string {
  return item.sku || item.variant?.sku || "N/A";
}

/**
 * Aggregates order line items by product (sums quantities across variants).
 */
export function aggregateProductSales(
  orders: OrderForProductSales[]
): ProductSaleAnalyticsRow[] {
  const map = new Map<string, ProductSaleAnalyticsRow>();

  for (const order of orders) {
    for (const item of order.items) {
      const productId = item.variant?.product?.id;
      if (!productId) {
        continue;
      }

      const title =
        item.variant?.product?.translations?.[0]?.title ??
        item.productTitle ??
        "Unknown Product";
      const image = resolveItemImage(item);
      const sku = resolveSku(item);

      const existing = map.get(productId);
      if (!existing) {
        map.set(productId, {
          productId,
          title,
          sku,
          totalQuantity: item.quantity,
          totalRevenue: item.total,
          orderCount: 1,
          image,
        });
        continue;
      }

      existing.totalQuantity += item.quantity;
      existing.totalRevenue += item.total;
      existing.orderCount += 1;
      if (!existing.image && image) {
        existing.image = image;
      }
      const nextSku = resolveSku(item);
      if (existing.sku !== nextSku) {
        existing.sku = MULTIPLE_SKUS_LABEL;
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Top N by sold quantity and bottom N among the rest (no overlap with top N).
 */
export function pickBestAndLeastSelling(
  rows: ProductSaleAnalyticsRow[],
  limit: number = PRODUCT_ANALYTICS_RANK_LIMIT
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

import { db } from '@white-shop/db';
import { getCachedJson } from '@/lib/services/read-through-json-cache';

const BESTSELLER_IDS_CACHE_KEY = 'cache:products:bestseller-ids:v1';
const BESTSELLER_IDS_TTL_SEC = 600;
const BESTSELLER_VARIANT_SAMPLE_LIMIT = 200;

type BestsellerVariant = { variantId: string | null; _sum: { quantity: number | null } };

async function computeBestsellerProductIds(): Promise<string[]> {
  const raw = await db.orderItem.groupBy({
    by: ['variantId'],
    _sum: { quantity: true },
    where: {
      variantId: {
        not: null,
      },
    },
    orderBy: {
      _sum: {
        quantity: 'desc' as const,
      },
    },
    take: BESTSELLER_VARIANT_SAMPLE_LIMIT,
  });
  const bestsellerVariants: BestsellerVariant[] = raw as BestsellerVariant[];

  const variantIds = bestsellerVariants
    .map((item) => item.variantId)
    .filter((id): id is string => Boolean(id));

  if (variantIds.length === 0) {
    return [];
  }

  const variantProductMap = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, productId: true },
  });

  const variantToProduct = new Map<string, string>();
  variantProductMap.forEach(({ id, productId }: { id: string; productId: string }) => {
    variantToProduct.set(id, productId);
  });

  const productSales = new Map<string, number>();
  bestsellerVariants.forEach((item: BestsellerVariant) => {
    const variantId = item.variantId;
    if (!variantId) {
      return;
    }
    const productId = variantToProduct.get(variantId);
    if (!productId) {
      return;
    }
    const qty = item._sum?.quantity || 0;
    productSales.set(productId, (productSales.get(productId) || 0) + qty);
  });

  return Array.from(productSales.entries())
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .map(([productId]) => productId);
}

/**
 * Top product IDs by order-item quantity (Redis-backed when configured).
 */
export async function getBestsellerProductIdsCached(): Promise<string[]> {
  return getCachedJson<string[]>(
    BESTSELLER_IDS_CACHE_KEY,
    BESTSELLER_IDS_TTL_SEC,
    computeBestsellerProductIds,
    { requireSharedCache: true },
  );
}

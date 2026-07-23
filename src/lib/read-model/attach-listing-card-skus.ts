import { db } from '@white-shop/db';

type ListingCardWithSku = {
  id: string;
  defaultVariantId?: string | null;
  sku?: string | null;
};

function normalizeSku(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

/**
 * Attaches listing SKUs onto card rows.
 * Prefers `defaultVariantId`, then falls back to any SKU on the product.
 */
export async function attachListingCardSkus<T extends ListingCardWithSku>(
  products: T[],
): Promise<Array<T & { sku: string | null }>> {
  if (products.length === 0) {
    return [];
  }

  const variantIds = [
    ...new Set(
      products
        .map((product) => product.defaultVariantId?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const skuByVariantId = new Map<string, string | null>();
  if (variantIds.length > 0) {
    const variants = await db.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, sku: true },
    });
    for (const variant of variants) {
      skuByVariantId.set(variant.id, normalizeSku(variant.sku));
    }
  }

  const missingProductIds = [
    ...new Set(
      products
        .filter((product) => {
          const fromVariant = product.defaultVariantId
            ? skuByVariantId.get(product.defaultVariantId)
            : null;
          return !fromVariant && !normalizeSku(product.sku);
        })
        .map((product) => product.id),
    ),
  ];

  const skuByProductId = new Map<string, string | null>();
  if (missingProductIds.length > 0) {
    const fallbackVariants = await db.productVariant.findMany({
      where: {
        productId: { in: missingProductIds },
        sku: { not: null },
      },
      select: { productId: true, sku: true, published: true, price: true },
      orderBy: [{ published: 'desc' }, { price: 'asc' }],
    });
    for (const variant of fallbackVariants) {
      if (skuByProductId.has(variant.productId)) {
        continue;
      }
      skuByProductId.set(variant.productId, normalizeSku(variant.sku));
    }
  }

  return products.map((product) => {
    const fromVariant = product.defaultVariantId
      ? skuByVariantId.get(product.defaultVariantId) ?? null
      : null;
    return {
      ...product,
      sku:
        fromVariant ??
        skuByProductId.get(product.id) ??
        normalizeSku(product.sku) ??
        null,
    };
  });
}

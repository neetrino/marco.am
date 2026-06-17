import { db } from "@white-shop/db";

/**
 * Extract image from product media
 */
export function extractImageFromMedia(media: unknown[] | undefined): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }

  const firstMedia = media[0];

  if (typeof firstMedia === "string") {
    return firstMedia;
  }

  if (firstMedia && typeof firstMedia === "object" && "url" in firstMedia) {
    const mediaObj = firstMedia as { url?: string };
    return mediaObj.url || null;
  }

  return null;
}

/**
 * Get top products for dashboard (aggregated in DB, not full table scan)
 */
export async function getTopProducts(limit: number = 5) {
  const variantGroups = await db.orderItem.groupBy({
    by: ["variantId"],
    where: { variantId: { not: null } },
    _sum: { quantity: true, total: true },
    _count: { _all: true },
    orderBy: { _sum: { total: "desc" } },
    take: limit,
  });

  const variantIds = variantGroups
    .map((group) => group.variantId)
    .filter((id): id is string => id !== null);

  if (variantIds.length === 0) {
    return [];
  }

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

  return variantGroups
    .map((group) => {
      if (!group.variantId) {
        return null;
      }
      const variant = variantById.get(group.variantId);
      const product = variant?.product;
      const title = product?.translations[0]?.title ?? "Unknown Product";

      return {
        variantId: group.variantId,
        productId: variant?.productId ?? "",
        title,
        sku: variant?.sku ?? "N/A",
        totalQuantity: group._sum.quantity ?? 0,
        totalRevenue: group._sum.total ?? 0,
        orderCount: group._count._all ?? 0,
        image: extractImageFromMedia(
          Array.isArray(product?.media) ? product.media : undefined,
        ),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

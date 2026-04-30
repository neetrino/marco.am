import { db } from "@white-shop/db";
import { buildPdpVisualPayloadFromPrisma } from "./products-slug/product-transformer";

const baseWhere = (slug: string) => ({
  translations: {
    some: { slug },
  },
  published: true,
  deletedAt: null as Date | null,
});

/**
 * Minimal Prisma read for PDP first paint — gallery + labels + discount badge only.
 * Heavier relations load via {@link productsSlugService.findBySlug}.
 */
export async function findBySlugVisual(slug: string, lang: string = "en") {
  const product = await db.product.findFirst({
    where: baseWhere(slug),
    select: {
      id: true,
      media: true,
      discountPercent: true,
      labels: true,
      translations: {
        select: { locale: true, title: true, slug: true },
      },
      variants: {
        where: { published: true },
        orderBy: { position: "asc" as const },
        select: {
          id: true,
          imageUrl: true,
          stock: true,
          stockReserved: true,
        },
      },
    },
  });

  if (!product) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Product not found",
      detail: `Product with slug '${slug}' does not exist or is not published`,
    };
  }

  return buildPdpVisualPayloadFromPrisma(product, slug, lang);
}

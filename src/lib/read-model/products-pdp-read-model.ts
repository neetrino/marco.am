import { db } from '@white-shop/db';
import type { transformProduct } from '@/lib/services/products-slug/product-transformer';

/** Detail payload shape stored in `product_pdp_rows.payload` (exact transform output). */
type PdpReadModelDetail = Awaited<ReturnType<typeof transformProduct>>;

/**
 * PDP hot-path read: single indexed fetch from `product_pdp_rows`.
 * Looks up by any locale slug (GIN on `slugs`) for the requested locale.
 * Returns `null` on miss so callers can fall back to the operational query.
 */
export async function getProductPdpFromReadModel(
  slug: string,
  lang: string,
): Promise<PdpReadModelDetail | null> {
  const row = await db.productPdpRow.findFirst({
    where: {
      locale: lang,
      isPublished: true,
      slugs: { has: slug },
    },
    select: { payload: true },
  });

  if (!row) {
    return null;
  }

  return row.payload as unknown as PdpReadModelDetail;
}

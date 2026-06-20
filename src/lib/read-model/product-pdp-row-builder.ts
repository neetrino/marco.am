import { Prisma } from '@white-shop/db/prisma';
import type { ListingDiscountSettings } from '@/lib/services/listing-discount-settings';
import { transformProduct } from '@/lib/services/products-slug/product-transformer';
import type { ProductWithFullRelations } from '@/lib/services/products-slug/types';

type ProductTranslationLike = { locale?: string | null; slug?: string | null };

/**
 * Collect every locale's slug for the product so a PDP row can be looked up by
 * any slug (matches the operational `translations.some.slug` behaviour).
 */
function collectProductSlugs(product: ProductWithFullRelations): string[] {
  const translations = Array.isArray(product.translations)
    ? (product.translations as ProductTranslationLike[])
    : [];
  const slugs = new Set<string>();
  for (const translation of translations) {
    const slug = translation.slug?.trim();
    if (slug) {
      slugs.add(slug);
    }
  }
  return [...slugs];
}

type BuildProductPdpRowsArgs = {
  product: ProductWithFullRelations;
  locales: readonly string[];
  discountSettings: ListingDiscountSettings;
  rebuiltAt: Date;
};

/**
 * Build one `product_pdp_rows` entry per locale holding the exact transformed
 * detail payload. The read path returns `payload` directly — no operational joins.
 */
export async function buildProductPdpRows(
  args: BuildProductPdpRowsArgs,
): Promise<Prisma.ProductPdpRowCreateManyInput[]> {
  const { product, locales, discountSettings, rebuiltAt } = args;
  const slugs = collectProductSlugs(product);
  const isPublished = product.published !== false && !product.deletedAt;

  const rows = await Promise.all(
    locales.map(async (locale) => {
      const payload = await transformProduct(product, locale, discountSettings);
      return {
        productId: product.id,
        locale,
        slug: payload.slug || '',
        slugs,
        payload: payload as unknown as Prisma.InputJsonValue,
        isPublished,
        productUpdatedAt: product.updatedAt ?? rebuiltAt,
        rebuiltAt,
      } satisfies Prisma.ProductPdpRowCreateManyInput;
    }),
  );

  return rows;
}

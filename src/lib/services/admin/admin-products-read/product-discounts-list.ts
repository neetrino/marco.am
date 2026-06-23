import { db } from "@white-shop/db";

import { cacheService } from "@/lib/services/cache.service";
import { getCachedJson } from "@/lib/services/read-through-json-cache";
import { logger } from "@/lib/utils/logger";

type ProductDiscountRow = {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  price: number;
  discountPercent: number;
  discountExpiresAt: string | null;
  searchText: string;
  sku: string;
};

const ADMIN_PRODUCT_DISCOUNTS_CACHE_TTL_SEC = 300;
const ADMIN_PRODUCT_DISCOUNTS_CACHE_PREFIX = "admin:product-discounts:v4:";

function normalizeLocale(localeInput?: string): string {
  const locale = localeInput?.trim().toLowerCase();
  return locale === "hy" || locale === "ru" || locale === "en" ? locale : "en";
}

function mapListingRow(
  row: {
    productId: string;
    title: string;
    slug: string;
    image: string | null;
    price: number;
    discountPercent: number;
    discountExpiresAt: string | Date | null;
    searchText: string;
  },
  sku: string,
): ProductDiscountRow {
  const expiresAt =
    row.discountExpiresAt instanceof Date
      ? row.discountExpiresAt.toISOString()
      : row.discountExpiresAt;

  return {
    id: row.productId,
    title: row.title,
    slug: row.slug,
    image: row.image,
    price: row.price,
    discountPercent: row.discountPercent,
    discountExpiresAt: expiresAt,
    searchText: row.searchText,
    sku,
  };
}

async function fetchVariantSkusByProductId(productIds: string[]): Promise<Map<string, string>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const variants = await db.productVariant.findMany({
    where: {
      productId: { in: productIds },
      published: true,
      sku: { not: null },
    },
    select: { productId: true, sku: true },
    orderBy: { price: "asc" },
  });

  const skusByProductId = new Map<string, string[]>();
  for (const variant of variants) {
    const sku = variant.sku?.trim();
    if (!sku) {
      continue;
    }
    const existing = skusByProductId.get(variant.productId) ?? [];
    if (!existing.includes(sku)) {
      existing.push(sku);
    }
    skusByProductId.set(variant.productId, existing);
  }

  return new Map(
    [...skusByProductId.entries()].map(([productId, skus]) => [productId, skus.join(" ")]),
  );
}

async function fetchProductExpiresAtByProductId(
  productIds: string[],
): Promise<Map<string, string | null>> {
  if (productIds.length === 0) {
    return new Map();
  }

  try {
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, discountExpiresAt: true },
    });

    return new Map(
      products.map((product) => [product.id, product.discountExpiresAt?.toISOString() ?? null]),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("discountExpiresAt")) {
      logger.warn(
        "[product-discounts-list] discountExpiresAt missing in Prisma client — run pnpm db:generate and restart the dev server",
      );
      return new Map();
    }
    throw error;
  }
}

async function fetchProductDiscountsListUncached(locale: string): Promise<{ data: ProductDiscountRow[] }> {
  const listingRows = await db.productListingRow.findMany({
    where: { locale, deletedAt: null, isPublished: true },
    select: {
      productId: true,
      title: true,
      slug: true,
      image: true,
      price: true,
      discountPercent: true,
      searchText: true,
      productCreatedAt: true,
    },
    orderBy: { productCreatedAt: "desc" },
  });

  const productIds = listingRows.map((row) => row.productId);
  const [skusByProductId, expiresAtByProductId] = await Promise.all([
    fetchVariantSkusByProductId(productIds),
    fetchProductExpiresAtByProductId(productIds),
  ]);

  const data = listingRows.map((row) =>
    mapListingRow(
      {
        ...row,
        discountExpiresAt: expiresAtByProductId.get(row.productId) ?? null,
      },
      skusByProductId.get(row.productId) ?? "",
    ),
  );

  return { data };
}

/** Clears cached admin product discount lists (all locales). */
export async function invalidateAdminProductDiscountsCache(): Promise<void> {
  await cacheService.deletePattern(`${ADMIN_PRODUCT_DISCOUNTS_CACHE_PREFIX}*`);
  await cacheService.deletePattern("admin:product-discounts:v2:*");
  await cacheService.deletePattern("admin:product-discounts:v1:*");
}

/**
 * Lightweight published product rows for admin discounts UI.
 * Hot path reads from the listing projection; variant SKUs are joined for client-side search.
 */
export async function getProductDiscountsList(
  localeInput?: string,
): Promise<{ data: ProductDiscountRow[] }> {
  const locale = normalizeLocale(localeInput);
  const cacheKey = `${ADMIN_PRODUCT_DISCOUNTS_CACHE_PREFIX}${locale}`;

  return getCachedJson(cacheKey, ADMIN_PRODUCT_DISCOUNTS_CACHE_TTL_SEC, () =>
    fetchProductDiscountsListUncached(locale),
  );
}

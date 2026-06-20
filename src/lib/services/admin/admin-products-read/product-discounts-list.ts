import { db } from "@white-shop/db";

import { cacheService } from "@/lib/services/cache.service";
import { getCachedJson } from "@/lib/services/read-through-json-cache";

type ProductDiscountRow = {
  id: string;
  title: string;
  image: string | null;
  price: number;
  discountPercent: number;
};

const ADMIN_PRODUCT_DISCOUNTS_CACHE_TTL_SEC = 300;
const ADMIN_PRODUCT_DISCOUNTS_CACHE_PREFIX = "admin:product-discounts:v1:";

const UNPUBLISHED_PRODUCT_SELECT = {
  id: true,
  discountPercent: true,
  media: true,
  createdAt: true,
  translations: {
    take: 1,
    select: { title: true },
  },
  variants: {
    where: { published: true },
    take: 1,
    orderBy: { price: "asc" as const },
    select: { price: true },
  },
} as const;

function normalizeLocale(localeInput?: string): string {
  const locale = localeInput?.trim().toLowerCase();
  return locale === "hy" || locale === "ru" || locale === "en" ? locale : "en";
}

function firstImageUrl(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }
  const first = media[0];
  return typeof first === "string" ? first : null;
}

function mapListingRow(row: {
  productId: string;
  title: string;
  image: string | null;
  price: number;
  discountPercent: number;
}): ProductDiscountRow {
  return {
    id: row.productId,
    title: row.title,
    image: row.image,
    price: row.price,
    discountPercent: row.discountPercent,
  };
}

function mapUnpublishedProduct(product: {
  id: string;
  discountPercent: number | null;
  media: unknown;
  translations: Array<{ title: string }>;
  variants: Array<{ price: number }>;
}): ProductDiscountRow {
  const title = product.translations[0]?.title?.trim() || product.id;
  const price = product.variants[0]?.price ?? 0;
  return {
    id: product.id,
    title,
    image: firstImageUrl(product.media),
    price,
    discountPercent: product.discountPercent ?? 0,
  };
}

async function fetchProductDiscountsListUncached(locale: string): Promise<{ data: ProductDiscountRow[] }> {
  const [listingRows, unpublishedProducts] = await Promise.all([
    db.productListingRow.findMany({
      where: { locale, deletedAt: null },
      select: {
        productId: true,
        title: true,
        image: true,
        price: true,
        discountPercent: true,
        productCreatedAt: true,
      },
      orderBy: { productCreatedAt: "desc" },
    }),
    db.product.findMany({
      where: { deletedAt: null, published: false },
      orderBy: { createdAt: "desc" },
      select: {
        ...UNPUBLISHED_PRODUCT_SELECT,
        translations: {
          where: { locale },
          take: 1,
          select: { title: true },
        },
      },
    }),
  ]);

  const publishedRows = listingRows.map((row) => ({
    row: mapListingRow(row),
    sortAt: row.productCreatedAt,
  }));
  const unpublishedRows = unpublishedProducts.map((product) => ({
    row: mapUnpublishedProduct(product),
    sortAt: product.createdAt,
  }));

  const data = [...publishedRows, ...unpublishedRows]
    .sort((left, right) => right.sortAt.getTime() - left.sortAt.getTime())
    .map((entry) => entry.row);

  return { data };
}

/** Clears cached quick-settings product discount lists (all locales). */
export async function invalidateAdminProductDiscountsCache(): Promise<void> {
  await cacheService.deletePattern(`${ADMIN_PRODUCT_DISCOUNTS_CACHE_PREFIX}*`);
}

/**
 * Lightweight product rows for quick-settings discount UI.
 * Hot path reads from the listing projection; unpublished products use a minimal fallback query.
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

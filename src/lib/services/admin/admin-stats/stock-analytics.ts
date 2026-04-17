import { db } from "@white-shop/db";

/**
 * Extract primary image URL from product `media` JSON array.
 */
function extractImageFromMedia(media: unknown[] | undefined): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }

  const firstMedia = media[0];

  if (typeof firstMedia === "string") {
    return firstMedia;
  }

  if (firstMedia && typeof firstMedia === "object" && "url" in firstMedia) {
    const mediaObj = firstMedia as { url?: string };
    return mediaObj.url ?? null;
  }

  return null;
}

function resolveImageUrl(
  variantImageUrl: string | null | undefined,
  productMedia: unknown[] | undefined
): string | null {
  if (variantImageUrl) {
    return variantImageUrl;
  }
  return extractImageFromMedia(productMedia);
}

export type StockAnalyticsVariantRow = {
  variantId: string;
  productId: string;
  sku: string | null;
  stock: number;
  stockReserved: number;
  productTitle: string;
  productSlug: string;
  brandName: string | null;
  imageUrl: string | null;
  updatedAt: string;
};

export type StockAnalyticsResult = {
  locale: string;
  lowStockThreshold: number;
  outOfStock: {
    total: number;
    items: StockAnalyticsVariantRow[];
  };
  lowStock: {
    total: number;
    items: StockAnalyticsVariantRow[];
  };
};

type VariantWithProduct = {
  id: string;
  productId: string;
  sku: string | null;
  stock: number;
  stockReserved: number;
  imageUrl: string | null;
  updatedAt: Date;
  product: {
    id: string;
    media: unknown[] | undefined;
    brand: { translations: Array<{ name: string }> } | null;
    translations: Array<{ title: string; slug: string }>;
  };
};

function mapRow(v: VariantWithProduct): StockAnalyticsVariantRow {
  const tr = v.product.translations[0];
  const brandTr = v.product.brand?.translations[0];
  return {
    variantId: v.id,
    productId: v.product.id,
    sku: v.sku,
    stock: v.stock,
    stockReserved: v.stockReserved,
    productTitle: tr?.title ?? "Unknown product",
    productSlug: tr?.slug ?? "",
    brandName: brandTr?.name ?? null,
    imageUrl: resolveImageUrl(v.imageUrl, v.product.media as unknown[] | undefined),
    updatedAt: v.updatedAt.toISOString(),
  };
}

function brandSelect(locale: string) {
  return {
    select: {
      translations: {
        where: { locale },
        take: 1,
        select: { name: true },
      },
    },
  };
}

const baseVariantWhere = {
  published: true,
  product: { deletedAt: null },
};

/**
 * Admin stock analytics: out-of-stock variants and low-stock variants (1 … threshold−1).
 */
export async function getStockAnalytics(params: {
  locale: string;
  lowStockThreshold: number;
  limit: number;
  offset: number;
}): Promise<StockAnalyticsResult> {
  const { locale, lowStockThreshold, limit, offset } = params;

  const [
    outTotal,
    lowTotal,
    outRows,
    lowRows,
  ] = await Promise.all([
    db.productVariant.count({
      where: {
        ...baseVariantWhere,
        stock: 0,
      },
    }),
    db.productVariant.count({
      where: {
        ...baseVariantWhere,
        stock: { gt: 0, lt: lowStockThreshold },
      },
    }),
    db.productVariant.findMany({
      where: {
        ...baseVariantWhere,
        stock: 0,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: limit,
      skip: offset,
      include: {
        product: {
          select: {
            id: true,
            media: true,
            brand: brandSelect(locale),
            translations: {
              where: { locale },
              take: 1,
            },
          },
        },
      },
    }),
    db.productVariant.findMany({
      where: {
        ...baseVariantWhere,
        stock: { gt: 0, lt: lowStockThreshold },
      },
      orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
      take: limit,
      skip: offset,
      include: {
        product: {
          select: {
            id: true,
            media: true,
            brand: brandSelect(locale),
            translations: {
              where: { locale },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  return {
    locale,
    lowStockThreshold,
    outOfStock: {
      total: outTotal,
      items: outRows.map((v) => mapRow(v)),
    },
    lowStock: {
      total: lowTotal,
      items: lowRows.map((v) => mapRow(v)),
    },
  };
}

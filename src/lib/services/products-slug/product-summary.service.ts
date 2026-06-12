import { db } from "@white-shop/db";

import { normalizeProductWarrantyYears } from "@/lib/constants/product-warranty";
import { pickVariantForListingPrice } from "@/lib/product-variant-listing-pick";
import { resolveProductPrice } from "@/lib/pricing/product-price";
import { processImageUrl } from "@/lib/utils/image-utils";

import { getListingDiscountSettings } from "../listing-discount-settings";

type SummaryCategory = {
  id: string;
  slug: string;
  title: string;
};

type SummaryBrand = {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
};

type ProductSummaryPayload = {
  id: string;
  slug: string;
  title: string;
  media: string[];
  variants: Array<{
    id: string;
    sku: string;
    price: number;
    stock: number;
    available: boolean;
    options: Array<{ attribute: string; value: string; key: string }>;
  }>;
  brand: SummaryBrand | null;
  categories: SummaryCategory[];
  labels: Array<{
    id: string;
    type: "text" | "percentage";
    value: string;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    color: string | null;
  }>;
  pricing: {
    currentPrice: number | null;
    oldPrice: number | null;
    discountBadge: {
      type: "percentage" | "special_price";
      value: number;
      label: string;
    } | null;
  };
  currentPrice: number | null;
  oldPrice: number | null;
  discountBadge: {
    type: "percentage" | "special_price";
    value: number;
    label: string;
  } | null;
  inStock: boolean;
  stockStatus: "in_stock" | "out_of_stock";
  warrantyYears: ReturnType<typeof normalizeProductWarrantyYears>;
};

function calculateActualDiscount(
  productDiscount: number,
  primaryCategoryId: string | null,
  brandId: string | null,
  categoryDiscounts: Record<string, number>,
  brandDiscounts: Record<string, number>,
  globalDiscount: number,
): number {
  if (productDiscount > 0) {
    return productDiscount;
  }
  if (primaryCategoryId && categoryDiscounts[primaryCategoryId]) {
    return categoryDiscounts[primaryCategoryId];
  }
  if (brandId && brandDiscounts[brandId]) {
    return brandDiscounts[brandId];
  }
  return globalDiscount > 0 ? globalDiscount : 0;
}

function buildDiscountBadge(
  discountPercent: number | null,
  isSpecialPrice: boolean,
): ProductSummaryPayload["discountBadge"] {
  if (isSpecialPrice) {
    return { type: "special_price", value: 0, label: "special_price" };
  }
  if (!discountPercent || discountPercent <= 0) {
    return null;
  }
  return {
    type: "percentage",
    value: discountPercent,
    label: `-${discountPercent}%`,
  };
}

function pickTranslation<T extends { locale: string }>(
  rows: T[],
  lang: string,
): T | null {
  return (
    rows.find((row) => row.locale === lang) ??
    rows.find((row) => row.locale === "en") ??
    rows[0] ??
    null
  );
}

/**
 * Lightweight PDP summary for immediate above-the-fold rendering.
 */
export async function findBySlugSummary(
  slug: string,
  lang: string = "en",
): Promise<ProductSummaryPayload> {
  const product = await db.product.findFirst({
    where: {
      published: true,
      deletedAt: null,
      translations: {
        some: { slug },
      },
    },
    select: {
      id: true,
      brandId: true,
      primaryCategoryId: true,
      discountPercent: true,
      warrantyYears: true,
      media: true,
      labels: true,
      translations: {
        select: {
          locale: true,
          title: true,
          slug: true,
        },
      },
      brand: {
        select: {
          id: true,
          slug: true,
          logoUrl: true,
          translations: {
            select: {
              locale: true,
              name: true,
            },
          },
        },
      },
      categories: {
        select: {
          id: true,
          translations: {
            select: {
              locale: true,
              slug: true,
              title: true,
            },
          },
        },
      },
      variants: {
        where: { published: true },
        select: {
          id: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          published: true,
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

  const { globalDiscount, categoryDiscounts, brandDiscounts } =
    await getListingDiscountSettings();
  const appliedDiscount = calculateActualDiscount(
    Number(product.discountPercent ?? 0),
    product.primaryCategoryId,
    product.brandId,
    categoryDiscounts,
    brandDiscounts,
    globalDiscount,
  );
  const primaryVariant = pickVariantForListingPrice(product.variants);
  const variantPrice = Number(primaryVariant?.price ?? 0);
  const compareAtPrice =
    typeof primaryVariant?.compareAtPrice === "number"
      ? primaryVariant.compareAtPrice
      : null;
  const resolvedPricing = resolveProductPrice({
    currentPrice: variantPrice,
    compareAtPrice,
    fallbackDiscountPercent: appliedDiscount > 0 ? appliedDiscount : null,
  });
  const discountBadge = buildDiscountBadge(
    resolvedPricing.discountPercent,
    resolvedPricing.isSpecialPrice,
  );
  const productTranslation = pickTranslation(product.translations, lang);
  const media = Array.isArray(product.media)
    ? product.media
        .map((item) => processImageUrl(item as string | { url?: string } | null))
        .filter((item): item is string => Boolean(item))
    : [];
  const categories = (product.categories ?? [])
    .map((category) => {
      const translation = pickTranslation(category.translations, lang);
      if (!translation?.slug || !translation?.title) {
        return null;
      }
      return {
        id: category.id,
        slug: translation.slug,
        title: translation.title,
      };
    })
    .filter((item): item is SummaryCategory => item != null);
  const brandTranslation = product.brand
    ? pickTranslation(product.brand.translations ?? [], lang)
    : null;
  const brand: SummaryBrand | null = product.brand
    ? {
        id: product.brand.id,
        slug: product.brand.slug,
        name: brandTranslation?.name ?? "",
        logo: processImageUrl(product.brand.logoUrl),
      }
    : null;
  const inStock = Array.isArray(product.variants)
    ? product.variants.some((variant) => Number(variant.stock ?? 0) > 0)
    : false;

  return {
    id: product.id,
    slug: productTranslation?.slug ?? slug,
    title: productTranslation?.title ?? "",
    media,
    variants: [],
    brand,
    categories,
    labels: (product.labels ?? []) as ProductSummaryPayload["labels"],
    pricing: {
      currentPrice: resolvedPricing.currentPrice,
      oldPrice: resolvedPricing.oldPrice,
      discountBadge,
    },
    currentPrice: resolvedPricing.currentPrice,
    oldPrice: resolvedPricing.oldPrice,
    discountBadge,
    inStock,
    stockStatus: inStock ? "in_stock" : "out_of_stock",
    warrantyYears: normalizeProductWarrantyYears(product.warrantyYears),
  };
}

export type { ProductSummaryPayload };

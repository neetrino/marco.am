import { Prisma } from '@white-shop/db/prisma';

/** Storefront listing card model shared by PLP, related carousel, and home rails. */
export type PlpReadModelProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  isSpecialPrice: boolean;
  image: string | null;
  images: string[];
  inStock: boolean;
  brand: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
  } | null;
  defaultVariantId: string | null;
  labels: unknown[];
  colors: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  warrantyBadge: { years: number } | null;
  requiresAttributeSelection: boolean;
};

/** Columns required to build a {@link PlpReadModelProduct} card from a listing row. */
export const LISTING_CARD_SELECT = {
  productId: true,
  slug: true,
  title: true,
  price: true,
  compareAtPrice: true,
  originalPrice: true,
  discountPercent: true,
  isSpecialPrice: true,
  image: true,
  images: true,
  inStock: true,
  brandId: true,
  brandSlug: true,
  brandName: true,
  brandLogoUrl: true,
  defaultVariantId: true,
  labels: true,
  colors: true,
  warrantyYears: true,
  requiresAttributeSelection: true,
} satisfies Prisma.ProductListingRowSelect;

export type ListingCardRow = Prisma.ProductListingRowGetPayload<{
  select: typeof LISTING_CARD_SELECT;
}>;

function normalizeJsonArray(value: Prisma.JsonValue): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeColors(value: Prisma.JsonValue): PlpReadModelProduct['colors'] {
  const colors: PlpReadModelProduct['colors'] = [];
  for (const item of normalizeJsonArray(value)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }
    const row = item as { value?: unknown; imageUrl?: unknown; colors?: unknown };
    const label = typeof row.value === 'string' ? row.value.trim() : '';
    if (!label) {
      continue;
    }
    colors.push({
      value: label,
      imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : null,
      colors: Array.isArray(row.colors)
        ? row.colors.filter((color): color is string => typeof color === 'string')
        : null,
    });
  }
  return colors;
}

/** Map a denormalized listing row into the shared storefront card model. */
export function mapListingRowToCard(row: ListingCardRow): PlpReadModelProduct {
  return {
    id: row.productId,
    slug: row.slug,
    title: row.title,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    originalPrice: row.originalPrice,
    discountPercent: row.discountPercent > 0 ? row.discountPercent : null,
    isSpecialPrice: row.isSpecialPrice,
    image: row.image,
    images: row.images,
    inStock: row.inStock,
    brand:
      row.brandId && row.brandSlug && row.brandName
        ? {
            id: row.brandId,
            slug: row.brandSlug,
            name: row.brandName,
            logoUrl: row.brandLogoUrl,
          }
        : null,
    defaultVariantId: row.defaultVariantId,
    labels: normalizeJsonArray(row.labels),
    colors: normalizeColors(row.colors),
    warrantyBadge: row.warrantyYears ? { years: row.warrantyYears } : null,
    requiresAttributeSelection: row.requiresAttributeSelection,
  };
}

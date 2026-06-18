import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';
import type { ProductListingBrand } from '@/lib/types/product-listing-brand';
import type { SpecialOfferProduct } from '@/components/home/special-offer-product.types';
import type { ProductLabel } from '@/components/ProductLabels';

/** Minimal listing row shape accepted by catalog, wishlist, and related-product cards. */
export type ProductListingCardInput = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  images?: string[];
  inStock: boolean;
  brand?: ProductListingBrand | null;
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
  categories?: Array<{ id: string; slug: string; title: string }>;
  defaultVariantId?: string | null;
  labels?: ProductLabel[];
  warrantyYears?: ProductWarrantyYears | null;
  warrantyBadge?: { years: ProductWarrantyYears } | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  requiresAttributeSelection?: boolean | null;
};

/**
 * Maps any listing row into the single {@link SpecialOfferProduct} card model.
 */
export function toSpecialOfferProduct(p: ProductListingCardInput): SpecialOfferProduct {
  const compareAt = p.compareAtPrice ?? null;
  const original =
    p.originalPrice && p.originalPrice > p.price
      ? p.originalPrice
      : compareAt && compareAt > p.price
        ? compareAt
        : (compareAt ?? undefined);

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    compareAtPrice: compareAt ?? undefined,
    originalPrice: original,
    image: p.image,
    images: p.images && p.images.length > 0 ? p.images : p.image ? [p.image] : undefined,
    inStock: p.inStock,
    brand: p.brand ?? null,
    categories: p.categories,
    defaultVariantId: p.defaultVariantId ?? undefined,
    discountPercent: p.discountPercent ?? null,
    isSpecialPrice: p.isSpecialPrice ?? false,
    labels: p.labels,
    warrantyYears: p.warrantyYears ?? p.warrantyBadge?.years ?? null,
    warrantyBadge: p.warrantyBadge,
    colors: p.colors,
    requiresAttributeSelection: p.requiresAttributeSelection,
  };
}

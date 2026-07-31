import type { ProductLabel } from '@/components/ProductLabels';
import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';
import type { ProductListingBrand } from '@/lib/types/product-listing-brand';

export type ShopGridProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  images?: string[];
  inStock: boolean;
  brand: ProductListingBrand | null;
  defaultVariantId: string | null;
  /** Listing / default variant SKU shown under the title. */
  sku?: string | null;
  colors: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  requiresAttributeSelection?: boolean | null;
  labels: ProductLabel[];
  categories?: Array<{ id: string; slug: string; title: string }>;
  warrantyYears?: ProductWarrantyYears | null;
  warrantyBadge?: { years: ProductWarrantyYears } | null;
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
};

export function normalizeShopGridProduct(p: unknown): ShopGridProduct {
  const row = p as {
    id: string;
    slug: string;
    title: string;
    price: number;
    compareAtPrice?: number | null;
    originalPrice?: number | null;
    image?: string | null;
    images?: string[];
    inStock?: boolean;
    brand?: ProductListingBrand | null;
    defaultVariantId?: string | null;
    sku?: string | null;
    colors?: ShopGridProduct['colors'];
    requiresAttributeSelection?: boolean | null;
    labels?: ProductLabel[];
    categories?: ShopGridProduct['categories'];
    warrantyYears?: ProductWarrantyYears | null;
    warrantyBadge?: { years: ProductWarrantyYears } | null;
    discountPercent?: number | null;
    isSpecialPrice?: boolean;
  };
  const sku = typeof row.sku === 'string' ? row.sku.trim() : '';
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? row.originalPrice ?? null,
    image: row.image ?? null,
    images: Array.isArray(row.images)
      ? row.images.filter((item): item is string => typeof item === 'string' && item.length > 0)
      : undefined,
    inStock: row.inStock ?? true,
    brand: row.brand ?? null,
    defaultVariantId: row.defaultVariantId ?? null,
    sku: sku.length > 0 ? sku : null,
    colors: row.colors ?? [],
    requiresAttributeSelection: row.requiresAttributeSelection ?? null,
    labels: row.labels ?? [],
    categories: row.categories ?? [],
    warrantyYears: row.warrantyYears ?? null,
    warrantyBadge: row.warrantyBadge ?? null,
    discountPercent: row.discountPercent ?? null,
    isSpecialPrice: row.isSpecialPrice ?? false,
  };
}

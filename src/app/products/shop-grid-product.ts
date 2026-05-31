import type { ProductLabel } from '@/components/ProductLabels';
import type { ProductListingBrand } from '@/lib/types/product-listing-brand';

export type ShopGridProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  inStock: boolean;
  brand: ProductListingBrand | null;
  defaultVariantId: string | null;
  colors: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  requiresAttributeSelection?: boolean | null;
  labels: ProductLabel[];
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
    inStock?: boolean;
    brand?: ProductListingBrand | null;
    defaultVariantId?: string | null;
    colors?: ShopGridProduct['colors'];
    requiresAttributeSelection?: boolean | null;
    labels?: ProductLabel[];
  };
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? row.originalPrice ?? null,
    image: row.image ?? null,
    inStock: row.inStock ?? true,
    brand: row.brand ?? null,
    defaultVariantId: row.defaultVariantId ?? null,
    colors: row.colors ?? [],
    requiresAttributeSelection: row.requiresAttributeSelection ?? null,
    labels: row.labels ?? [],
  };
}

import type { ProductLabel } from '@/components/ProductLabels';
import type { ProductListingBrand } from '@/lib/types/product-listing-brand';
import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';

export interface SpecialOfferProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  image: string | null;
  inStock: boolean;
  brand: ProductListingBrand | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  originalPrice?: number | null;
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
  labels?: ProductLabel[];
  warrantyYears?: ProductWarrantyYears | null;
  warrantyBadge?: { years: ProductWarrantyYears } | null;
  defaultVariantId?: string | null;
  requiresAttributeSelection?: boolean | null;
}

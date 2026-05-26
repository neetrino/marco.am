import type { ProductListingBrand } from '@/lib/types/product-listing-brand';
import type { ProductLabel } from '../ProductLabels';
import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';

export interface SpecialOfferProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  image: string | null;
  /** All product gallery URLs (`media`); omitted on older payloads — treat as `[image]`. */
  images?: string[];
  inStock: boolean;
  brand: ProductListingBrand | null;
  defaultVariantId?: string | null;
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
  labels?: ProductLabel[];
  warrantyYears?: ProductWarrantyYears | null;
  warrantyBadge?: { years: ProductWarrantyYears } | null;
  colors?: Array<{
    value: string;
    imageUrl?: string | null;
    colors?: string[] | null;
  }>;
  requiresAttributeSelection?: boolean | null;
  /** When true, card shows image + neutral skeletons for text/price until full row arrives. */
  detailsPending?: boolean;
  /**
   * First-paint shells before any listing payload (no slug yet). Disables links and side actions.
   */
  shellPlaceholder?: boolean;
}

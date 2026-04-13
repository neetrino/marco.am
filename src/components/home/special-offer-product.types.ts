import type { ProductLabel } from '../ProductLabels';

export interface SpecialOfferProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  image: string | null;
  inStock: boolean;
  brand: { id: string; name: string } | null;
  defaultVariantId?: string | null;
  discountPercent?: number | null;
  labels?: ProductLabel[];
  colors?: Array<{
    value: string;
    imageUrl?: string | null;
    colors?: string[] | null;
  }>;
}

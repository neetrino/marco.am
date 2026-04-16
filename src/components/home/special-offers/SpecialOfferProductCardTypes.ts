import type { ProductLabel } from '@/components/ProductLabels';

export interface SpecialOfferProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  image: string | null;
  inStock: boolean;
  brand: { id: string; name: string } | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  originalPrice?: number | null;
  discountPercent?: number | null;
  labels?: ProductLabel[];
  defaultVariantId?: string | null;
}

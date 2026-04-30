import type { ProductLabel } from '../ProductLabels';

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
  brand: { id: string; name: string } | null;
  defaultVariantId?: string | null;
  discountPercent?: number | null;
  labels?: ProductLabel[];
  /** Published review count for `(n)` next to stars; omit when unknown. */
  reviewCount?: number;
  colors?: Array<{
    value: string;
    imageUrl?: string | null;
    colors?: string[] | null;
  }>;
  /** When true, card shows image + neutral skeletons for text/price until full row arrives. */
  detailsPending?: boolean;
  /**
   * First-paint shells before any listing payload (no slug yet). Disables links and side actions.
   */
  shellPlaceholder?: boolean;
}

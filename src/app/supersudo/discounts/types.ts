import type { DiscountKind } from '@/lib/discount/discount-expiry';

export interface DiscountsCategory {
  id: string;
  title: string;
  parentId: string | null;
}

export interface DiscountsBrand {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface DiscountsProductRow {
  id: string;
  title: string;
  image?: string | null;
  price?: number;
  discountType?: DiscountKind;
  discountValue?: number | null;
  discountExpiresAt?: string | null;
  slug?: string;
  searchText?: string;
  sku?: string;
}

export { matchesProductSearchFields } from '@/lib/product-search/match';

/** Keeps the first row per product id (listing projection wins over unpublished fallback). */
export function dedupeDiscountProductRows(rows: DiscountsProductRow[]): DiscountsProductRow[] {
  const seen = new Set<string>();
  const unique: DiscountsProductRow[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) {
      continue;
    }
    seen.add(row.id);
    unique.push(row);
  }
  return unique;
}

export interface QuickSettingsCategory {
  id: string;
  title: string;
  parentId: string | null;
}

export interface QuickSettingsBrand {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface QuickSettingsProductRow {
  id: string;
  title: string;
  image?: string | null;
  price?: number;
  discountPercent?: number;
  slug?: string;
  searchText?: string;
  sku?: string;
}

export { matchesProductSearchFields } from '@/lib/product-search/match';

/** Keeps the first row per product id (listing projection wins over unpublished fallback). */
export function dedupeQuickSettingsProductRows(
  rows: QuickSettingsProductRow[],
): QuickSettingsProductRow[] {
  const seen = new Set<string>();
  const unique: QuickSettingsProductRow[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) {
      continue;
    }
    seen.add(row.id);
    unique.push(row);
  }
  return unique;
}

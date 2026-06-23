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
  searchText?: string;
  sku?: string;
}

/** Token-based search aligned with admin product list (title, slug, brand, SKU). */
export function matchesQuickSettingsProductSearch(
  row: QuickSettingsProductRow,
  rawQuery: string,
): boolean {
  const tokens = rawQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }

  const haystack = [row.title, row.searchText, row.sku]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

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

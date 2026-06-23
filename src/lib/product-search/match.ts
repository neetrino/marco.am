/** Split user search into words; ignores extra whitespace between tokens. */
export function splitProductSearchTokens(search: string): string[] {
  return search.trim().split(/\s+/).filter(Boolean);
}

export type ProductSearchFields = {
  title?: string | null;
  slug?: string | null;
  searchText?: string | null;
  sku?: string | null;
};

function fieldContainsToken(field: string | null | undefined, token: string): boolean {
  if (!field?.trim()) {
    return false;
  }
  return field.toLowerCase().includes(token.toLowerCase());
}

function tokenMatchesFields(fields: ProductSearchFields, token: string): boolean {
  return (
    fieldContainsToken(fields.title, token) ||
    fieldContainsToken(fields.slug, token) ||
    fieldContainsToken(fields.searchText, token) ||
    fieldContainsToken(fields.sku, token)
  );
}

/**
 * Client-side product search: every token must match title, slug, searchText, or SKU.
 */
export function matchesProductSearchFields(
  fields: ProductSearchFields,
  rawQuery: string,
): boolean {
  const tokens = splitProductSearchTokens(rawQuery);
  if (tokens.length === 0) {
    return true;
  }
  return tokens.every((token) => tokenMatchesFields(fields, token));
}

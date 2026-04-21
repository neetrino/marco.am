interface CardProductIdentity {
  id?: string | null;
  title?: string | null;
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Deduplicates card items so the same display title is rendered once.
 * Falls back to `id` when title is missing.
 */
export function dedupeCardProductsByTitle<T extends CardProductIdentity>(products: T[]): T[] {
  const seenTitles = new Set<string>();
  const seenIds = new Set<string>();

  return products.filter((product) => {
    const rawTitle = typeof product.title === 'string' ? product.title : '';
    const normalizedTitle = rawTitle ? normalizeTitle(rawTitle) : '';

    if (normalizedTitle) {
      if (seenTitles.has(normalizedTitle)) {
        return false;
      }
      seenTitles.add(normalizedTitle);
      return true;
    }

    const id = typeof product.id === 'string' ? product.id : '';
    if (!id || seenIds.has(id)) {
      return false;
    }
    seenIds.add(id);
    return true;
  });
}

import { apiClient } from '../../lib/api-client';
import { getStoredLanguage } from '../../lib/language';

/** PLP row shape — enough for cart line display (title, image, slug). */
export type GuestCartCatalogProduct = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  defaultVariantId?: string | null;
  inStock?: boolean;
};

const CATALOG_IDS_CHUNK = 500;

/**
 * Loads catalog rows for cart product IDs in one (or chunked) request.
 */
export async function fetchGuestCartCatalogProducts(
  productIds: string[],
): Promise<Map<string, GuestCartCatalogProduct>> {
  const uniqueIds = [...new Set(productIds.filter((id) => id.trim().length > 0))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const lang = getStoredLanguage();
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += CATALOG_IDS_CHUNK) {
    chunks.push(uniqueIds.slice(i, i + CATALOG_IDS_CHUNK));
  }

  const responses = await Promise.all(
    chunks.map((chunk) =>
      apiClient.get<{
        data: GuestCartCatalogProduct[];
      }>('/api/v1/products', {
        params: {
          lang,
          ids: chunk.join(','),
          limit: String(chunk.length),
        },
      }),
    ),
  );

  const byId = new Map<string, GuestCartCatalogProduct>();
  for (const row of responses.flatMap((response) => response.data ?? [])) {
    byId.set(row.id, row);
  }
  return byId;
}

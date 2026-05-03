import { apiClient } from '@/lib/api-client';
import type { LanguageCode } from '@/lib/language';
import type { ProductListingBrand } from '@/lib/types/product-listing-brand';

export type RelatedProductsApiResponse = {
  data: RelatedProductRow[];
  meta: {
    total: number;
    limit?: number;
    rules?: { category: number; brand: number; other: number };
  };
};

/** Row shape returned by `/api/v1/products/[slug]/related` (used by carousel cards). */
export type RelatedProductRow = {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  image: string | null;
  inStock: boolean;
  brand?: ProductListingBrand | null;
  categories?: Array<{ id: string; slug: string; title: string }>;
  variants?: Array<{
    options?: Array<{ key: string; value: string }>;
  }>;
  recommendationRule?: string;
};

function encodeProductSlugForPath(productSlug: string): string {
  const trimmed = productSlug.trim();
  const normalized = (() => {
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  })();
  return encodeURIComponent(normalized);
}

export async function fetchRelatedProducts(
  productSlug: string,
  lang: LanguageCode,
  limit = 10,
): Promise<RelatedProductsApiResponse> {
  const encodedSlug = encodeProductSlugForPath(productSlug);
  return apiClient.get<RelatedProductsApiResponse>(`/api/v1/products/${encodedSlug}/related`, {
    params: { limit: String(limit), lang },
  });
}

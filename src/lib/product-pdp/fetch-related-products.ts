import { apiClient } from '@/lib/api-client';
import type { LanguageCode } from '@/lib/language';
import type { ProductListingBrand } from '@/lib/types/product-listing-brand';
import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';
import { logger } from '@/lib/utils/logger';

export type RelatedProductsApiResponse = {
  data: RelatedProductRow[];
  meta: {
    total: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
    rules?: { category: number; brand: number; other: number };
  };
};

/** Row shape returned by `/api/v1/products/[slug]/related` (used by carousel cards). */
export type RelatedProductRow = {
  id: string;
  slug: string;
  title: string;
  price: number;
  defaultVariantId?: string | null;
  originalPrice?: number | null;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
  image: string | null;
  inStock: boolean;
  brand?: ProductListingBrand | null;
  categories?: Array<{ id: string; slug: string; title: string }>;
  variants?: Array<{
    options?: Array<{ key: string; value: string }>;
  }>;
  recommendationRule?: string;
  warrantyYears?: ProductWarrantyYears | null;
  warrantyBadge?: { years: ProductWarrantyYears } | null;
};

export function hasUsableRelatedPayload(
  payload: RelatedProductsApiResponse | null | undefined,
): payload is RelatedProductsApiResponse {
  return Boolean(payload?.data?.length);
}

const RELATED_PRODUCTS_TIMEOUT_MS = 12_000;

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

function isRequestTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('request timeout') || message.includes(' did not respond within ');
}

export async function fetchRelatedProducts(
  productSlug: string,
  lang: LanguageCode,
  limit = 4,
  offset = 0,
): Promise<RelatedProductsApiResponse> {
  const encodedSlug = encodeProductSlugForPath(productSlug);
  try {
    return await apiClient.get<RelatedProductsApiResponse>(`/api/v1/products/${encodedSlug}/related`, {
      params: { limit: String(limit), offset: String(offset), lang },
      timeoutMs: RELATED_PRODUCTS_TIMEOUT_MS,
      suppressNetworkErrorLogging: true,
    });
  } catch (error: unknown) {
    if (isRequestTimeoutError(error)) {
      logger.devWarn('⏱️ [RELATED PRODUCTS] Request timed out', {
        productSlug,
        limit,
        lang,
        timeoutMs: RELATED_PRODUCTS_TIMEOUT_MS,
      });
    }

    throw error;
  }
}

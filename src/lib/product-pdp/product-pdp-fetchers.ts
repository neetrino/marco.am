import type { Product } from '@/app/products/[slug]/types';
import { apiClient, getErrorHttpStatus } from '@/lib/api-client';
import { type LanguageCode } from '@/lib/language';
import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';

export type { PdpVisualPayload };

const PRODUCT_DETAIL_NOT_FOUND_TTL_MS = 60_000;

type CachedProductDetailError = {
  readonly expiresAt: number;
  readonly error: unknown;
};

const productDetailInFlight = new Map<string, Promise<Product>>();
const productDetailNotFoundCache = new Map<string, CachedProductDetailError>();

function productDetailCacheKey(slug: string, lang: LanguageCode): string {
  return `${lang}:${slug}`;
}

function throwCachedNotFound(key: string): void {
  const cached = productDetailNotFoundCache.get(key);
  if (!cached) {
    return;
  }
  if (cached.expiresAt <= Date.now()) {
    productDetailNotFoundCache.delete(key);
    return;
  }
  throw cached.error;
}

async function requestProductDetail(slug: string, lang: LanguageCode): Promise<Product> {
  const key = productDetailCacheKey(slug, lang);
  throwCachedNotFound(key);

  const existing = productDetailInFlight.get(key);
  if (existing) {
    return existing;
  }

  const request = apiClient
    .get<Product>(`/api/v1/products/${slug}`, { params: { lang } })
    .catch((error: unknown) => {
      if (getErrorHttpStatus(error) === 404) {
        productDetailNotFoundCache.set(key, {
          expiresAt: Date.now() + PRODUCT_DETAIL_NOT_FOUND_TTL_MS,
          error,
        });
      }
      throw error;
    })
    .finally(() => {
      productDetailInFlight.delete(key);
    });

  productDetailInFlight.set(key, request);
  return request;
}

/** Client-side fetchers shared by `useProductFetch` and hover prefetch. */
export async function fetchProductVisual(
  slug: string,
  lang: LanguageCode,
): Promise<PdpVisualPayload> {
  try {
    return await apiClient.get<PdpVisualPayload>(`/api/v1/products/${slug}/visual`, {
      params: { lang },
    });
  } catch (error: unknown) {
    if (getErrorHttpStatus(error) === 404 && lang !== 'en') {
      return apiClient.get<PdpVisualPayload>(`/api/v1/products/${slug}/visual`, {
        params: { lang: 'en' },
      });
    }
    throw error;
  }
}

export type ProductDetailPayload = Awaited<ReturnType<typeof fetchProductDetail>>;

export async function fetchProductSummary(slug: string, lang: LanguageCode): Promise<Product> {
  try {
    return await apiClient.get<Product>(`/api/v1/products/${slug}/summary`, {
      params: { lang },
    });
  } catch (error: unknown) {
    if (getErrorHttpStatus(error) === 404 && lang !== 'en') {
      return apiClient.get<Product>(`/api/v1/products/${slug}/summary`, {
        params: { lang: 'en' },
      });
    }
    throw error;
  }
}

export async function fetchProductDetail(slug: string, lang: LanguageCode): Promise<Product> {
  try {
    return await requestProductDetail(slug, lang);
  } catch (error: unknown) {
    if (getErrorHttpStatus(error) === 404 && lang !== 'en') {
      return requestProductDetail(slug, 'en');
    }
    throw error;
  }
}

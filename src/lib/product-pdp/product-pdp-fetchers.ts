import type { Product } from '@/app/products/[slug]/types';
import { apiClient } from '@/lib/api-client';
import { type LanguageCode } from '@/lib/language';
import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';

export type { PdpVisualPayload };

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
    const errorStatus =
      error && typeof error === 'object' && 'status' in error ? Number(error.status) : undefined;
    if (errorStatus === 404 && lang !== 'en') {
      return apiClient.get<PdpVisualPayload>(`/api/v1/products/${slug}/visual`, {
        params: { lang: 'en' },
      });
    }
    throw error;
  }
}

export type ProductDetailPayload = Awaited<ReturnType<typeof fetchProductDetail>>;

export async function fetchProductDetail(slug: string, lang: LanguageCode): Promise<Product> {
  try {
    return await apiClient.get<Product>(`/api/v1/products/${slug}`, {
      params: { lang },
    });
  } catch (error: unknown) {
    const errorStatus =
      error && typeof error === 'object' && 'status' in error ? Number(error.status) : undefined;
    if (errorStatus === 404 && lang !== 'en') {
      return apiClient.get<Product>(`/api/v1/products/${slug}`, {
        params: { lang: 'en' },
      });
    }
    throw error;
  }
}

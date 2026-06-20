import { apiClient } from '@/lib/api-client';
import type { ProductEditorSection } from '@/app/supersudo/products/add/product-editor-tabs';
import type { ProductData } from '@/app/supersudo/products/add/types';
import { buildProductEditorSectionCacheKey } from '@/lib/admin/admin-cache-keys';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';
import { getStoredLanguage } from '@/lib/language';
import {
  fetchAdminAttributes,
  fetchAdminBrands,
  fetchAdminCategoriesLite,
  fetchAdminSettings,
} from '@/lib/admin/admin-reference-data-cache';

let referenceDataWarmStarted = false;

export function readProductEditorSectionCache(
  productId: string,
  section: ProductEditorSection,
): ProductData | null {
  const key = buildProductEditorSectionCacheKey(productId, section);
  return readAdminSessionCache<ProductData>(key, ADMIN_SESSION_CACHE_TTL_MS);
}

export function invalidateProductEditorSectionCaches(productId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const storagePrefix = `marco-admin:product-editor/${productId}/`;
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(storagePrefix)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
}

/** Fetches one editor section with session cache + in-flight dedup. */
export function fetchProductEditorSection(
  productId: string,
  section: ProductEditorSection,
  options?: { force?: boolean },
): Promise<ProductData> {
  const cacheKey = buildProductEditorSectionCacheKey(productId, section);
  const cached = readProductEditorSectionCache(productId, section);
  if (!options?.force && cached !== null) {
    return Promise.resolve(cached);
  }

  const requestKey = `product-editor-fetch:${productId}:${section}`;
  return dedupedAdminRequest(requestKey, () =>
    apiClient.get<ProductData>(`/api/v1/supersudo/products/${productId}`, {
      params: { section },
    }),
  ).then((data) => {
    writeAdminSessionCache(cacheKey, data);
    return data;
  });
}

/** Brands, categories lite, attributes, settings — shared session cache. */
export function warmProductEditorReferenceData(): void {
  if (referenceDataWarmStarted) {
    return;
  }
  referenceDataWarmStarted = true;

  const language = getStoredLanguage();
  void fetchAdminBrands();
  void fetchAdminCategoriesLite(language);
  void fetchAdminAttributes();
  void fetchAdminSettings();
}

/** Single-section warm on pointer down (before click) — general only. */
export function warmProductEditorGeneralSection(productId: string): void {
  void fetchProductEditorSection(productId, 'general');
}

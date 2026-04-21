'use client';

import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/utils/logger';

/** Legacy key — migrated once to the server-backed compare API. */
export const LEGACY_COMPARE_STORAGE_KEY = 'shop_compare';

export type CompareClientSpec = {
  key: string;
  name: string;
  value: string;
};

export type CompareClientItem = {
  productId: string;
  title: string;
  slug: string;
  image: string | null;
  brand: {
    id: string;
    name: string;
  } | null;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  inStock: boolean;
  addedAt: string;
  specifications: CompareClientSpec[];
};

export type CompareClientSpecRow = {
  key: string;
  name: string;
  valuesByProductId: Record<string, string | null>;
  different: boolean;
};

export type CompareClientResponse = {
  compare: {
    id: string;
    maxItems: number;
    items: CompareClientItem[];
  };
  specRows: CompareClientSpecRow[];
};

const cacheByLang = new Map<string, string[]>();
const inflightByLang = new Map<string, Promise<string[]>>();

export function invalidateCompareCache(): void {
  cacheByLang.clear();
  inflightByLang.clear();
}

function dispatchCompareUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('compare-updated'));
}

function addCompareIdToCache(lang: string, productId: string): void {
  const current = cacheByLang.get(lang);
  if (!current) {
    return;
  }
  if (current.includes(productId)) {
    return;
  }
  cacheByLang.set(lang, [...current, productId]);
}

function removeCompareIdFromCache(lang: string, productId: string): void {
  const current = cacheByLang.get(lang);
  if (!current) {
    return;
  }
  cacheByLang.set(
    lang,
    current.filter((id) => id !== productId)
  );
}

/**
 * Returns product IDs in the current compare list (guest cookie or authenticated user).
 */
export async function fetchCompareProductIds(lang: string): Promise<string[]> {
  const hit = cacheByLang.get(lang);
  if (hit) return hit;

  let inflight = inflightByLang.get(lang);
  if (!inflight) {
    inflight = (async () => {
      const res = await apiClient.get<CompareClientResponse>('/api/v1/compare', {
        params: { lang },
        credentials: 'include',
      });
      const ids = res.compare.items.map((i) => i.productId);
      cacheByLang.set(lang, ids);
      return ids;
    })();
    inflightByLang.set(lang, inflight);
  }

  try {
    return await inflight;
  } finally {
    inflightByLang.delete(lang);
  }
}

export async function fetchComparePayload(lang: string): Promise<CompareClientResponse> {
  return apiClient.get<CompareClientResponse>('/api/v1/compare', {
    params: { lang },
    credentials: 'include',
  });
}

export async function addCompareItemClient(productId: string, lang: string): Promise<void> {
  await apiClient.post<CompareClientResponse>(
    '/api/v1/compare',
    { productId },
    { params: { lang }, credentials: 'include' }
  );
  inflightByLang.delete(lang);
  addCompareIdToCache(lang, productId);
  dispatchCompareUpdated();
}

export async function removeCompareItemClient(productId: string, lang: string): Promise<void> {
  await apiClient.delete<CompareClientResponse>(`/api/v1/compare/${encodeURIComponent(productId)}`, {
    params: { lang },
    credentials: 'include',
  });
  inflightByLang.delete(lang);
  removeCompareIdFromCache(lang, productId);
  dispatchCompareUpdated();
}

/**
 * After login/registration: merge anonymous compare list (cookie) into the user account.
 */
export async function mergeGuestCompareAfterAuth(): Promise<void> {
  try {
    await apiClient.post<{ mergedItems: number; guestCompareFound: boolean }>(
      '/api/v1/compare/merge',
      {},
      { credentials: 'include' }
    );
    invalidateCompareCache();
    dispatchCompareUpdated();
  } catch (error: unknown) {
    logger.devLog('[Compare] merge after auth skipped or failed', { error });
  }
}

/**
 * One-time migration from pre-API `localStorage` compare list to the server.
 */
export async function migrateLegacyCompareFromLocalStorage(lang: string): Promise<void> {
  if (typeof window === 'undefined') return;

  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_COMPARE_STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    try {
      localStorage.removeItem(LEGACY_COMPARE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    try {
      localStorage.removeItem(LEGACY_COMPARE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  const productIds = parsed.filter((x): x is string => typeof x === 'string' && x.length > 0);
  if (productIds.length === 0) {
    try {
      localStorage.removeItem(LEGACY_COMPARE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  for (const productId of productIds) {
    try {
      await apiClient.post<CompareClientResponse>(
        '/api/v1/compare',
        { productId },
        { params: { lang }, credentials: 'include' }
      );
    } catch {
      /* item may be unavailable or max cap reached */
    }
  }

  try {
    localStorage.removeItem(LEGACY_COMPARE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  invalidateCompareCache();
  dispatchCompareUpdated();
}

export async function fetchCompareItemCount(lang: string): Promise<number> {
  const ids = await fetchCompareProductIds(lang);
  return ids.length;
}

/**
 * Called on app surfaces that need a guest cookie + server rows for legacy `localStorage` data.
 */
export async function ensureLegacyCompareMigratedForGuest(lang: string): Promise<void> {
  if (typeof window === 'undefined') return;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_COMPARE_STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  await migrateLegacyCompareFromLocalStorage(lang);
}

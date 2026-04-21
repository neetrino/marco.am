'use client';

import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/utils/logger';

/** Legacy key — migrated once to the server-backed wishlist API. */
export const LEGACY_WISHLIST_STORAGE_KEY = 'shop_wishlist';

export type WishlistClientItem = {
  productId: string;
  title: string;
  slug: string;
  image: string | null;
  addedAt: string;
};

export type WishlistClientResponse = {
  wishlist: {
    id: string;
    items: WishlistClientItem[];
  };
};

const cacheByLang = new Map<string, string[]>();
const inflightByLang = new Map<string, Promise<string[]>>();

export function invalidateWishlistCache(): void {
  cacheByLang.clear();
  inflightByLang.clear();
}

function dispatchWishlistUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('wishlist-updated'));
}

function addWishlistIdToCache(lang: string, productId: string): void {
  const current = cacheByLang.get(lang);
  if (!current) {
    return;
  }
  if (current.includes(productId)) {
    return;
  }
  cacheByLang.set(lang, [...current, productId]);
}

function removeWishlistIdFromCache(lang: string, productId: string): void {
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
 * Returns product IDs in the current wishlist (guest cookie or authenticated user).
 */
export async function fetchWishlistProductIds(lang: string): Promise<string[]> {
  const hit = cacheByLang.get(lang);
  if (hit) return hit;

  let inflight = inflightByLang.get(lang);
  if (!inflight) {
    inflight = (async () => {
      const res = await apiClient.get<WishlistClientResponse>('/api/v1/wishlist', {
        params: { lang },
        credentials: 'include',
      });
      const ids = res.wishlist.items.map((i) => i.productId);
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

export async function fetchWishlistPayload(lang: string): Promise<WishlistClientResponse> {
  return apiClient.get<WishlistClientResponse>('/api/v1/wishlist', {
    params: { lang },
    credentials: 'include',
  });
}

export async function addWishlistItemClient(productId: string, lang: string): Promise<void> {
  await apiClient.post<WishlistClientResponse>(
    '/api/v1/wishlist',
    { productId },
    { params: { lang }, credentials: 'include' }
  );
  inflightByLang.delete(lang);
  addWishlistIdToCache(lang, productId);
  dispatchWishlistUpdated();
}

export async function removeWishlistItemClient(productId: string, lang: string): Promise<void> {
  await apiClient.delete<WishlistClientResponse>(`/api/v1/wishlist/${encodeURIComponent(productId)}`, {
    params: { lang },
    credentials: 'include',
  });
  inflightByLang.delete(lang);
  removeWishlistIdFromCache(lang, productId);
  dispatchWishlistUpdated();
}

/**
 * After login/registration: merge anonymous wishlist (cookie) into the user account.
 */
export async function mergeGuestWishlistAfterAuth(): Promise<void> {
  try {
    await apiClient.post<{ mergedItems: number; guestWishlistFound: boolean }>(
      '/api/v1/wishlist/merge',
      {},
      { credentials: 'include' }
    );
    invalidateWishlistCache();
    dispatchWishlistUpdated();
  } catch (error: unknown) {
    logger.devLog('[Wishlist] merge after auth skipped or failed', { error });
  }
}

/**
 * One-time migration from pre-API `localStorage` wishlist to the server.
 */
export async function migrateLegacyWishlistFromLocalStorage(lang: string): Promise<void> {
  if (typeof window === 'undefined') return;

  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_WISHLIST_STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    try {
      localStorage.removeItem(LEGACY_WISHLIST_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    try {
      localStorage.removeItem(LEGACY_WISHLIST_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  const productIds = parsed.filter((x): x is string => typeof x === 'string' && x.length > 0);
  if (productIds.length === 0) {
    try {
      localStorage.removeItem(LEGACY_WISHLIST_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  for (const productId of productIds) {
    try {
      await apiClient.post<WishlistClientResponse>(
        '/api/v1/wishlist',
        { productId },
        { params: { lang }, credentials: 'include' }
      );
    } catch {
      /* product may be unavailable — continue */
    }
  }

  try {
    localStorage.removeItem(LEGACY_WISHLIST_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  invalidateWishlistCache();
  dispatchWishlistUpdated();
}

export async function fetchWishlistItemCount(lang: string): Promise<number> {
  const ids = await fetchWishlistProductIds(lang);
  return ids.length;
}

/**
 * Called on app surfaces that need a guest cookie + server rows for legacy `localStorage` data.
 */
export async function ensureLegacyWishlistMigratedForGuest(lang: string): Promise<void> {
  if (typeof window === 'undefined') return;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_WISHLIST_STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  await migrateLegacyWishlistFromLocalStorage(lang);
}

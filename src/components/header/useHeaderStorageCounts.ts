'use client';

import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { usePathname } from 'next/navigation';
import { getCompareCount, getWishlistCount } from '../../lib/storageCounts';
import { getStoredLanguage } from '@/lib/language';
import {
  ensureLegacyCompareMigratedForGuest,
  fetchCompareItemCount,
} from '@/lib/compare/compare-client';
import {
  ensureLegacyWishlistMigratedForGuest,
  fetchWishlistItemCount,
} from '@/lib/wishlist/wishlist-client';

const HOME_PATH = '/';
/** Defer header count API sync on home so SSR + rails are not competing for the DB pool. */
const HOME_STORAGE_SYNC_DEFER_MS = 10_000;

function scheduleIdleSync(run: () => void, timeoutMs: number): () => void {
  const w = typeof window !== 'undefined' ? window : null;
  if (!w) {
    return () => {};
  }
  if ('requestIdleCallback' in w) {
    const id = w.requestIdleCallback(run, { timeout: timeoutMs });
    return () => w.cancelIdleCallback(id);
  }
  const timerId = globalThis.setTimeout(run, Math.min(timeoutMs, 3000));
  return () => globalThis.clearTimeout(timerId);
}

/**
 * Subscribes to wishlist/compare localStorage events and updates counts.
 */
export function useHeaderStorageCounts(
  setWishlistCount: Dispatch<SetStateAction<number>>,
  setCompareCount: Dispatch<SetStateAction<number>>,
  onAuthChange: () => void
) {
  const pathname = usePathname() ?? '';
  const isHomeRoute = pathname === HOME_PATH;
  const wishlistSyncSeqRef = useRef(0);
  const compareSyncSeqRef = useRef(0);

  useEffect(() => {
    let isActive = true;
    let cancelDeferredSync: (() => void) | undefined;

    const updateWishlistCount = () => {
      const requestSeq = ++wishlistSyncSeqRef.current;
      const run = async () => {
        try {
          const lang = getStoredLanguage();
          await ensureLegacyWishlistMigratedForGuest(lang);
          const count = await fetchWishlistItemCount(lang);
          if (!isActive || requestSeq !== wishlistSyncSeqRef.current) {
            return;
          }
          setWishlistCount(count);
        } catch {
          if (!isActive || requestSeq !== wishlistSyncSeqRef.current) {
            return;
          }
          setWishlistCount(getWishlistCount());
        }
      };
      void run();
    };

    const updateCompareCount = async () => {
      const requestSeq = ++compareSyncSeqRef.current;
      try {
        const lang = getStoredLanguage();
        await ensureLegacyCompareMigratedForGuest(lang);
        const count = await fetchCompareItemCount(lang);
        if (!isActive || requestSeq !== compareSyncSeqRef.current) {
          return;
        }
        setCompareCount(count);
      } catch {
        if (!isActive || requestSeq !== compareSyncSeqRef.current) {
          return;
        }
        // Fallback for offline/API failures.
        setCompareCount(getCompareCount());
      }
    };

    const syncCountsFromApi = () => {
      updateWishlistCount();
      void updateCompareCount();
    };

    if (isHomeRoute) {
      setWishlistCount(getWishlistCount());
      setCompareCount(getCompareCount());
      cancelDeferredSync = scheduleIdleSync(syncCountsFromApi, HOME_STORAGE_SYNC_DEFER_MS);
    } else {
      syncCountsFromApi();
    }

    const handleWishlistUpdate = () => updateWishlistCount();
    const handleCompareUpdate = () => {
      void updateCompareCount();
    };
    const handleAuthUpdate = () => {
      updateWishlistCount();
      void updateCompareCount();
      onAuthChange();
    };
    const handleLanguageUpdate = () => {
      updateWishlistCount();
      void updateCompareCount();
    };
    const handleWishlistOptimisticUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ delta?: number }>).detail;
      const delta = detail?.delta;
      if (typeof delta === 'number') {
        setWishlistCount((prev) => Math.max(0, prev + delta));
      }
    };
    const handleCompareOptimisticUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ delta?: number }>).detail;
      const delta = detail?.delta;
      if (typeof delta === 'number') {
        setCompareCount((prev) => Math.max(0, prev + delta));
      }
    };
    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    window.addEventListener('compare-updated', handleCompareUpdate);
    window.addEventListener('auth-updated', handleAuthUpdate);
    window.addEventListener('language-updated', handleLanguageUpdate);
    window.addEventListener('wishlist-optimistic-updated', handleWishlistOptimisticUpdate);
    window.addEventListener('compare-optimistic-updated', handleCompareOptimisticUpdate);

    return () => {
      isActive = false;
      cancelDeferredSync?.();
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('compare-updated', handleCompareUpdate);
      window.removeEventListener('auth-updated', handleAuthUpdate);
      window.removeEventListener('language-updated', handleLanguageUpdate);
      window.removeEventListener('wishlist-optimistic-updated', handleWishlistOptimisticUpdate);
      window.removeEventListener('compare-optimistic-updated', handleCompareOptimisticUpdate);
    };
  }, [isHomeRoute, setWishlistCount, setCompareCount, onAuthChange]);
}

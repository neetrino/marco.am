'use client';

import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
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

/**
 * Subscribes to wishlist/compare localStorage events and updates counts.
 */
export function useHeaderStorageCounts(
  setWishlistCount: Dispatch<SetStateAction<number>>,
  setCompareCount: Dispatch<SetStateAction<number>>,
  onAuthChange: () => void
) {
  const wishlistSyncSeqRef = useRef(0);
  const compareSyncSeqRef = useRef(0);

  useEffect(() => {
    let isActive = true;

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

    updateWishlistCount();
    void updateCompareCount();

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
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('compare-updated', handleCompareUpdate);
      window.removeEventListener('auth-updated', handleAuthUpdate);
      window.removeEventListener('language-updated', handleLanguageUpdate);
      window.removeEventListener('wishlist-optimistic-updated', handleWishlistOptimisticUpdate);
      window.removeEventListener('compare-optimistic-updated', handleCompareOptimisticUpdate);
    };
  }, [setWishlistCount, setCompareCount, onAuthChange]);
}

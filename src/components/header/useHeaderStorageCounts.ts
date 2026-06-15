'use client';

import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { usePathname } from 'next/navigation';
import { getCompareCount, getWishlistCount } from '../../lib/storageCounts';
import { getStoredLanguage } from '@/lib/language';
import {
  resolveHeaderMembershipSyncDeferMs,
  scheduleIdleSync,
} from '@/lib/deferred-idle-sync';
import { useCompareProductIds } from '@/components/hooks/useCompareProductIds';
import { useWishlistProductIds } from '@/components/hooks/useWishlistProductIds';
import { ensureLegacyCompareMigratedForGuest } from '@/lib/compare/compare-client';
import { ensureLegacyWishlistMigratedForGuest } from '@/lib/wishlist/wishlist-client';

/**
 * Subscribes to wishlist/compare localStorage events and updates counts.
 * Membership API sync is deferred so static/home first paint does not compete with SSR data fetches.
 */
export function useHeaderStorageCounts(
  setWishlistCount: Dispatch<SetStateAction<number>>,
  setCompareCount: Dispatch<SetStateAction<number>>,
  onAuthChange: () => void,
  options?: {
    enabled?: boolean;
  },
) {
  const enabled = options?.enabled ?? true;
  const pathname = usePathname() ?? '';
  const membershipSyncDeferMs = resolveHeaderMembershipSyncDeferMs(pathname);
  const [membershipApiEnabled, setMembershipApiEnabled] = useState(false);
  const { ids: wishlistIds } = useWishlistProductIds({ queryEnabled: membershipApiEnabled });
  const { ids: compareIds } = useCompareProductIds({ queryEnabled: membershipApiEnabled });
  const wishlistSyncSeqRef = useRef(0);
  const compareSyncSeqRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setMembershipApiEnabled(false);
      return;
    }
    setMembershipApiEnabled(false);
    setWishlistCount(getWishlistCount());
    setCompareCount(getCompareCount());
    return scheduleIdleSync(() => {
      setMembershipApiEnabled(true);
    }, membershipSyncDeferMs);
  }, [enabled, membershipSyncDeferMs, pathname, setCompareCount, setWishlistCount]);

  useEffect(() => {
    if (!enabled || !membershipApiEnabled) {
      return;
    }
    setWishlistCount(wishlistIds.length);
  }, [enabled, membershipApiEnabled, wishlistIds.length, setWishlistCount]);

  useEffect(() => {
    if (!enabled || !membershipApiEnabled) {
      return;
    }
    setCompareCount(compareIds.length);
  }, [compareIds.length, enabled, membershipApiEnabled, setCompareCount]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isActive = true;

    const updateWishlistCount = () => {
      if (!membershipApiEnabled) {
        setWishlistCount(getWishlistCount());
        return;
      }
      const requestSeq = ++wishlistSyncSeqRef.current;
      const run = async () => {
        try {
          const lang = getStoredLanguage();
          await ensureLegacyWishlistMigratedForGuest(lang);
          if (!isActive || requestSeq !== wishlistSyncSeqRef.current) {
            return;
          }
          setWishlistCount(wishlistIds.length);
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
      if (!membershipApiEnabled) {
        setCompareCount(getCompareCount());
        return;
      }
      const requestSeq = ++compareSyncSeqRef.current;
      try {
        const lang = getStoredLanguage();
        await ensureLegacyCompareMigratedForGuest(lang);
        if (!isActive || requestSeq !== compareSyncSeqRef.current) {
          return;
        }
        setCompareCount(compareIds.length);
      } catch {
        if (!isActive || requestSeq !== compareSyncSeqRef.current) {
          return;
        }
        setCompareCount(getCompareCount());
      }
    };

    const handleAuthUpdate = () => {
      if (membershipApiEnabled) {
        updateWishlistCount();
        void updateCompareCount();
      } else {
        setWishlistCount(getWishlistCount());
        setCompareCount(getCompareCount());
      }
      onAuthChange();
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

    window.addEventListener('wishlist-updated', updateWishlistCount);
    window.addEventListener('compare-updated', updateCompareCount);
    window.addEventListener('auth-updated', handleAuthUpdate);
    window.addEventListener('language-updated', updateWishlistCount);
    window.addEventListener('language-updated', updateCompareCount);
    window.addEventListener('wishlist-optimistic-updated', handleWishlistOptimisticUpdate);
    window.addEventListener('compare-optimistic-updated', handleCompareOptimisticUpdate);

    return () => {
      isActive = false;
      window.removeEventListener('wishlist-updated', updateWishlistCount);
      window.removeEventListener('compare-updated', updateCompareCount);
      window.removeEventListener('auth-updated', handleAuthUpdate);
      window.removeEventListener('language-updated', updateWishlistCount);
      window.removeEventListener('language-updated', updateCompareCount);
      window.removeEventListener('wishlist-optimistic-updated', handleWishlistOptimisticUpdate);
      window.removeEventListener('compare-optimistic-updated', handleCompareOptimisticUpdate);
    };
  }, [
    enabled,
    membershipApiEnabled,
    onAuthChange,
    setCompareCount,
    setWishlistCount,
    compareIds.length,
    wishlistIds.length,
  ]);
}

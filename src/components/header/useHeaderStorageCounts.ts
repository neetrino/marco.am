'use client';

import { useEffect } from 'react';
import { getCompareCount, getWishlistCount } from '../../lib/storageCounts';

/**
 * Subscribes to wishlist/compare localStorage events and updates counts.
 */
export function useHeaderStorageCounts(
  setWishlistCount: (n: number) => void,
  setCompareCount: (n: number) => void,
  onAuthChange: () => void
) {
  useEffect(() => {
    const updateCounts = () => {
      setWishlistCount(getWishlistCount());
      setCompareCount(getCompareCount());
    };

    updateCounts();

    const handleWishlistUpdate = () => setWishlistCount(getWishlistCount());
    const handleCompareUpdate = () => setCompareCount(getCompareCount());
    const handleAuthUpdate = () => {
      setWishlistCount(getWishlistCount());
      setCompareCount(getCompareCount());
      onAuthChange();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    window.addEventListener('compare-updated', handleCompareUpdate);
    window.addEventListener('auth-updated', handleAuthUpdate);

    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('compare-updated', handleCompareUpdate);
      window.removeEventListener('auth-updated', handleAuthUpdate);
    };
  }, [setWishlistCount, setCompareCount, onAuthChange]);
}

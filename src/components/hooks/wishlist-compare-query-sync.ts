'use client';

import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';

let registered = false;

/** One global listener — avoids N cards each invalidating membership queries on PLP. */
export function registerWishlistCompareQuerySync(queryClient: QueryClient): void {
  if (registered || typeof window === 'undefined') {
    return;
  }
  registered = true;

  const invalidateWishlist = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.wishlistProductIdsRoot() });
  };
  const invalidateCompare = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.compareProductIdsRoot() });
  };

  window.addEventListener('wishlist-updated', invalidateWishlist);
  window.addEventListener('compare-updated', invalidateCompare);
  window.addEventListener('auth-updated', () => {
    invalidateWishlist();
    invalidateCompare();
  });
}

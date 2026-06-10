'use client';

import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { invalidateCompareCache } from '@/lib/compare/compare-client';
import { invalidateWishlistCache } from '@/lib/wishlist/wishlist-client';

let registered = false;

/** One global listener — avoids N cards each invalidating membership queries on PLP. */
export function registerWishlistCompareQuerySync(queryClient: QueryClient): void {
  if (registered || typeof window === 'undefined') {
    return;
  }
  registered = true;

  const invalidateWishlist = (forceRefetch: boolean) => {
    invalidateWishlistCache();
    if (!forceRefetch) {
      return;
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.wishlistProductIdsRoot() });
  };
  const invalidateCompare = (forceRefetch: boolean) => {
    invalidateCompareCache();
    if (!forceRefetch) {
      return;
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.compareProductIdsRoot() });
  };

  window.addEventListener('wishlist-updated', () => invalidateWishlist(false));
  window.addEventListener('compare-updated', () => invalidateCompare(false));
  window.addEventListener('auth-updated', () => {
    invalidateWishlist(true);
    invalidateCompare(true);
  });
}

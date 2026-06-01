import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useCompareProductIds } from '@/components/hooks/useCompareProductIds';
import { useWishlistProductIds } from '@/components/hooks/useWishlistProductIds';

interface UseWishlistCompareProps {
  productId: string | null;
}

function patchMembershipIds(
  ids: string[],
  productId: string,
  include: boolean,
): string[] {
  const has = ids.includes(productId);
  if (include && !has) {
    return [...ids, productId];
  }
  if (!include && has) {
    return ids.filter((id) => id !== productId);
  }
  return ids;
}

export function useWishlistCompare({ productId }: UseWishlistCompareProps) {
  const queryClient = useQueryClient();
  const { ids: wishlistIds, queryKey: wishlistKey } = useWishlistProductIds();
  const { ids: compareIds, queryKey: compareKey } = useCompareProductIds();

  const isInWishlist = productId ? wishlistIds.includes(productId) : false;
  const isInCompare = productId ? compareIds.includes(productId) : false;

  const setIsInWishlist = useCallback(
    (value: boolean) => {
      if (!productId) {
        return;
      }
      queryClient.setQueryData<string[]>(wishlistKey, (current = []) =>
        patchMembershipIds(current, productId, value),
      );
    },
    [productId, queryClient, wishlistKey],
  );

  const setIsInCompare = useCallback(
    (value: boolean) => {
      if (!productId) {
        return;
      }
      queryClient.setQueryData<string[]>(compareKey, (current = []) =>
        patchMembershipIds(current, productId, value),
      );
    },
    [productId, queryClient, compareKey],
  );

  return { isInWishlist, setIsInWishlist, isInCompare, setIsInCompare };
}

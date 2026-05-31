'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import {
  addWishlistItemClient,
  PENDING_WISHLIST_PRODUCT_QUERY_PARAM,
  removeWishlistItemClient,
} from '@/lib/wishlist/wishlist-client';
import { logger } from '@/lib/utils/logger';
import { useAuth } from '@/lib/auth/AuthContext';

import { useWishlistProductIds } from './useWishlistProductIds';

function patchWishlistIds(
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

/**
 * Wishlist toggle backed by `GET`/`DELETE` `/api/v1/wishlist` for all users; `POST` requires login.
 */
export function useWishlist(productId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { ids, language, queryKey } = useWishlistProductIds();
  const [isToggling, setIsToggling] = useState(false);
  const isTogglingRef = useRef(false);

  const isInWishlist = productId ? ids.includes(productId) : false;

  const toggleWishlist = async () => {
    if (!productId) {
      return;
    }
    if (isTogglingRef.current) {
      return;
    }

    const previousValue = isInWishlist;
    const nextValue = !previousValue;
    if (nextValue) {
      if (authLoading) {
        return;
      }
      if (!isLoggedIn) {
        const redirectTarget = pathname || '/products';
        const loginQs = new URLSearchParams();
        loginQs.set('redirect', redirectTarget);
        loginQs.set(PENDING_WISHLIST_PRODUCT_QUERY_PARAM, productId);
        router.push(`/login?${loginQs.toString()}`);
        return;
      }
    }

    const delta = nextValue ? 1 : -1;
    isTogglingRef.current = true;
    setIsToggling(true);
    queryClient.setQueryData<string[]>(queryKey, (current = []) =>
      patchWishlistIds(current, productId, nextValue),
    );

    if (!nextValue) {
      window.dispatchEvent(
        new CustomEvent('wishlist-remove-optimistic', {
          detail: { productId },
        }),
      );
    }

    window.dispatchEvent(
      new CustomEvent('wishlist-optimistic-updated', {
        detail: { delta },
      }),
    );

    try {
      if (nextValue) {
        await addWishlistItemClient(productId, language);
      } else {
        await removeWishlistItemClient(productId, language);
      }
    } catch (error: unknown) {
      queryClient.setQueryData<string[]>(queryKey, (current = []) =>
        patchWishlistIds(current, productId, previousValue),
      );
      if (!nextValue) {
        window.dispatchEvent(
          new CustomEvent('wishlist-remove-reverted', {
            detail: { productId },
          }),
        );
      }
      window.dispatchEvent(
        new CustomEvent('wishlist-optimistic-updated', {
          detail: { delta: -delta },
        }),
      );
      logger.error('Wishlist toggle failed', { error });
    } finally {
      isTogglingRef.current = false;
      setIsToggling(false);
    }
  };

  return { isInWishlist, toggleWishlist, isToggling };
}

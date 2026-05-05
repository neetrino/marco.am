'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  addWishlistItemClient,
  fetchWishlistProductIds,
  PENDING_WISHLIST_PRODUCT_QUERY_PARAM,
  removeWishlistItemClient,
} from '@/lib/wishlist/wishlist-client';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import { logger } from '@/lib/utils/logger';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Wishlist toggle backed by `GET`/`DELETE` `/api/v1/wishlist` for all users; `POST` requires login.
 */
export function useWishlist(productId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(() => getStoredLanguage());
  const [isToggling, setIsToggling] = useState(false);
  const isMountedRef = useRef(true);
  const isTogglingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    isTogglingRef.current = isToggling;
  }, [isToggling]);

  const refresh = useCallback(async () => {
    if (!productId) {
      if (isMountedRef.current) {
        setIsInWishlist(false);
      }
      return;
    }
    if (isTogglingRef.current) {
      return;
    }
    try {
      const ids = await fetchWishlistProductIds(language);
      if (!isMountedRef.current || isTogglingRef.current) {
        return;
      }
      setIsInWishlist(ids.includes(productId));
    } catch (error: unknown) {
      logger.devLog('[useWishlist] refresh failed', { error });
      if (!isMountedRef.current || isTogglingRef.current) {
        return;
      }
      setIsInWishlist(false);
    }
  }, [productId, language]);

  useEffect(() => {
    const onLang = () => setLanguage(getStoredLanguage());
    window.addEventListener('language-updated', onLang);
    return () => window.removeEventListener('language-updated', onLang);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onUpdate = () => {
      void refresh();
    };
    window.addEventListener('wishlist-updated', onUpdate);
    window.addEventListener('auth-updated', onUpdate);
    return () => {
      window.removeEventListener('wishlist-updated', onUpdate);
      window.removeEventListener('auth-updated', onUpdate);
    };
  }, [refresh]);

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
    setIsInWishlist(nextValue);

    if (!nextValue) {
      window.dispatchEvent(
        new CustomEvent('wishlist-remove-optimistic', {
          detail: { productId },
        })
      );
    }

    window.dispatchEvent(
      new CustomEvent('wishlist-optimistic-updated', {
        detail: { delta },
      })
    );

    try {
      if (nextValue) {
        await addWishlistItemClient(productId, language);
      } else {
        await removeWishlistItemClient(productId, language);
      }
    } catch (error: unknown) {
      if (isMountedRef.current) {
        setIsInWishlist(previousValue);
      }
      if (!nextValue) {
        window.dispatchEvent(
          new CustomEvent('wishlist-remove-reverted', {
            detail: { productId },
          })
        );
      }
      window.dispatchEvent(
        new CustomEvent('wishlist-optimistic-updated', {
          detail: { delta: -delta },
        })
      );
      logger.error('Wishlist toggle failed', { error });
      void refresh();
    } finally {
      isTogglingRef.current = false;
      if (isMountedRef.current) {
        setIsToggling(false);
      }
      void refresh();
    }
  };

  return { isInWishlist, toggleWishlist };
}

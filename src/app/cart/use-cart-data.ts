'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getStoredCurrency } from '../../lib/currency';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';
import type { Cart } from './types';
import { readStoredGuestCart } from './guest-cart-local';
import { buildGuestCartFromStorage, fetchCart } from './cart-fetcher';
import { handleRemoveItem, handleUpdateQuantity } from './cart-handlers';
import { applyOptimisticCartAdd } from './apply-optimistic-cart-add';
import { guestCartNeedsCatalogPriceResolution } from '../../lib/cart/guest-cart-totals';
import { isGenericCartTitle, mergeCartDisplayState } from './merge-cart-display';
import { preloadNewCartImages } from './preload-cart-images';

function guestCartHydrationFingerprint(): string {
  return readStoredGuestCart()
    .map((item) => `${item.productId}:${item.variantId}`)
    .join('|');
}

export function useCartData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const isLocalUpdateRef = useRef(false);
  const cartFetchGenerationRef = useRef(0);
  const guestHydrationInFlightRef = useRef(false);
  const guestHydrationAttemptedRef = useRef<string | null>(null);
  const cartRef = useRef<Cart | null>(null);
  cartRef.current = cart;

  const invalidateInFlightCartLoads = useCallback(() => {
    cartFetchGenerationRef.current += 1;
  }, []);

  const syncGuestCartFromStorage = useCallback(() => {
    const snapshot = buildGuestCartFromStorage(t);
    setCart(snapshot);
    setLoading(false);
    return snapshot;
  }, [t]);

  const hydrateGuestCartInBackground = useCallback(
    async (snapshot: Cart | null) => {
      const needsDisplayHydration = snapshot?.items.some(
        (row) => !row.variant.product.image || isGenericCartTitle(row.variant.product.title),
      );
      const needsPriceHydration = guestCartNeedsCatalogPriceResolution(readStoredGuestCart());
      const needsHydration = needsDisplayHydration || needsPriceHydration;
      if (!needsHydration) {
        return;
      }

      const fingerprint = guestCartHydrationFingerprint();
      if (
        guestHydrationInFlightRef.current ||
        (fingerprint.length > 0 && guestHydrationAttemptedRef.current === fingerprint)
      ) {
        return;
      }

      guestHydrationInFlightRef.current = true;
      guestHydrationAttemptedRef.current = fingerprint;
      const generation = ++cartFetchGenerationRef.current;
      try {
        const cartData = await fetchCart(false, t);
        if (generation !== cartFetchGenerationRef.current) {
          return;
        }
        if (!cartData) {
          syncGuestCartFromStorage();
          return;
        }

        const latestSnapshot = buildGuestCartFromStorage(t);
        const mergeBase = latestSnapshot ?? snapshot ?? cartRef.current;
        const merged = mergeCartDisplayState(mergeBase, cartData);
        if (generation !== cartFetchGenerationRef.current) {
          return;
        }
        setCart(merged);
        void preloadNewCartImages(mergeBase, merged);
      } catch (_error: unknown) {
        if (generation === cartFetchGenerationRef.current) {
          syncGuestCartFromStorage();
        }
      } finally {
        if (generation === cartFetchGenerationRef.current) {
          guestHydrationInFlightRef.current = false;
        }
      }
    },
    [syncGuestCartFromStorage, t],
  );

  const loadCart = useCallback(async () => {
    const waitForAuth = isLoggedIn && authLoading;
    if (waitForAuth) {
      return;
    }

    if (!isLoggedIn) {
      const snapshot = syncGuestCartFromStorage();
      await hydrateGuestCartInBackground(snapshot);
      return;
    }

    const generation = ++cartFetchGenerationRef.current;
    const hasCachedCart = cartRef.current !== null;
    if (!hasCachedCart) {
      setLoading(true);
    }

    try {
      const cartData = await fetchCart(true, t);
      if (generation !== cartFetchGenerationRef.current) {
        return;
      }
      if (!cartData) {
        if (!hasCachedCart) {
          setCart(null);
        }
        return;
      }
      const merged = mergeCartDisplayState(cartRef.current, cartData);
      if (generation !== cartFetchGenerationRef.current) {
        return;
      }
      setCart(merged);
      void preloadNewCartImages(cartRef.current, merged);
    } catch (_error: unknown) {
      if (generation !== cartFetchGenerationRef.current) {
        return;
      }
      if (!hasCachedCart) {
        setCart(null);
      }
    } finally {
      if (generation === cartFetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [authLoading, hydrateGuestCartInBackground, isLoggedIn, syncGuestCartFromStorage, t]);

  useEffect(() => {
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    const handleCartUpdate = (event: Event) => {
      if (!enabled) {
        return;
      }
      const detail = (event as CustomEvent<{
        optimisticAdd?: { quantity?: number; price?: number };
        itemsCount?: number;
        total?: number;
        currency?: string;
        hydrated?: boolean;
      }>).detail;

      if (!isLoggedIn) {
        if (isLocalUpdateRef.current) {
          isLocalUpdateRef.current = false;
          invalidateInFlightCartLoads();
          return;
        }
        if (detail?.hydrated === true) {
          return;
        }
        guestHydrationAttemptedRef.current = null;
        const snapshot = syncGuestCartFromStorage();
        invalidateInFlightCartLoads();
        void hydrateGuestCartInBackground(snapshot);
        return;
      }

      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false;
        return;
      }
      if (detail?.optimisticAdd) {
        const nextCart = applyOptimisticCartAdd(cartRef.current, detail.optimisticAdd, t);
        if (nextCart) {
          setCart(nextCart);
          setLoading(false);
        }
        return;
      }
      if (detail?.itemsCount !== undefined && detail?.total !== undefined) {
        void loadCart();
        return;
      }
      void loadCart();
    };

    const handleAuthUpdate = () => {
      if (!enabled) {
        return;
      }
      void loadCart();
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('auth-updated', handleAuthUpdate);

    const canLoad = enabled && (!authLoading || !isLoggedIn);
    if (canLoad) {
      void loadCart();
    }

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('auth-updated', handleAuthUpdate);
    };
  }, [
    authLoading,
    enabled,
    hydrateGuestCartInBackground,
    invalidateInFlightCartLoads,
    isLoggedIn,
    loadCart,
    syncGuestCartFromStorage,
    t,
  ]);

  const onRemoveItem = useCallback(
    async (itemId: string) => {
      if (!cart) {
        return;
      }
      invalidateInFlightCartLoads();
      isLocalUpdateRef.current = true;
      await handleRemoveItem(itemId, cart, isLoggedIn, setCart, loadCart);
    },
    [cart, invalidateInFlightCartLoads, isLoggedIn, loadCart],
  );

  const onUpdateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      invalidateInFlightCartLoads();
      isLocalUpdateRef.current = true;
      await handleUpdateQuantity(
        itemId,
        quantity,
        cart,
        isLoggedIn,
        setCart,
        setUpdatingItems,
        loadCart,
        t,
      );
    },
    [cart, invalidateInFlightCartLoads, isLoggedIn, loadCart, t],
  );

  return {
    cart,
    loading,
    currency,
    updatingItems,
    isLoggedIn,
    loadCart,
    onRemoveItem,
    onUpdateQuantity,
    t,
  };
}

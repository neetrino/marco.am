'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getStoredCurrency } from '../../lib/currency';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';
import type { Cart } from './types';
import { fetchCart } from './cart-fetcher';
import { handleRemoveItem, handleUpdateQuantity } from './cart-handlers';

export function useCartData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const isLocalUpdateRef = useRef(false);
  const cartFetchGenerationRef = useRef(0);

  const loadCart = useCallback(async () => {
    if (authLoading) {
      return;
    }
    const generation = ++cartFetchGenerationRef.current;
    try {
      setLoading(true);
      const cartData = await fetchCart(isLoggedIn, t);
      if (generation !== cartFetchGenerationRef.current) {
        return;
      }
      setCart(cartData);
    } catch (_error: unknown) {
      if (generation !== cartFetchGenerationRef.current) {
        return;
      }
      setCart(null);
    } finally {
      if (generation === cartFetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [authLoading, isLoggedIn, t]);

  useEffect(() => {
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    const handleCartUpdate = () => {
      if (!enabled) {
        return;
      }
      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false;
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

    if (!authLoading && enabled) {
      void loadCart();
    }

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('auth-updated', handleAuthUpdate);
    };
  }, [authLoading, enabled, loadCart]);

  const onRemoveItem = useCallback(
    async (itemId: string) => {
      if (!cart) {
        return;
      }
      isLocalUpdateRef.current = true;
      await handleRemoveItem(itemId, cart, isLoggedIn, setCart, loadCart);
    },
    [cart, isLoggedIn, loadCart],
  );

  const onUpdateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
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
    [cart, isLoggedIn, loadCart, t],
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

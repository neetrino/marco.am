'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api-client';
import { coerceCurrencyCode, type CurrencyCode } from '../currency';
import { CART_KEY } from '../storageCounts';
import { logger } from '../utils/logger';

export type CartSummaryState = {
  cartCount: number;
  cartTotal: number;
  cartTotalCurrency: CurrencyCode;
  fetchCart: () => Promise<void>;
};

export function useCartSummaryState(): CartSummaryState {
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartTotalCurrency, setCartTotalCurrency] = useState<CurrencyCode>('AMD');

  const fetchCart = useCallback(async () => {
    if (authLoading) {
      return;
    }
    if (!isLoggedIn) {
      if (typeof window === 'undefined') {
        setCartCount(0);
        setCartTotal(0);
        setCartTotalCurrency('AMD');
        return;
      }

      try {
        const stored = localStorage.getItem(CART_KEY);
        const guestCart: Array<{
          productId: string;
          productSlug?: string;
          variantId: string;
          quantity: number;
          price?: number;
        }> = stored ? JSON.parse(stored) : [];

        if (guestCart.length === 0) {
          setCartCount(0);
          setCartTotal(0);
          setCartTotalCurrency('AMD');
          return;
        }

        const itemsCount = guestCart.reduce((sum, item) => sum + Number(item.quantity), 0);
        const total = guestCart.reduce(
          (sum, item) => sum + (Number(item.price) || 0) * Number(item.quantity),
          0
        );
        setCartCount(itemsCount);
        setCartTotal(total);
        setCartTotalCurrency('AMD');
      } catch (error) {
        logger.error('Error loading guest cart', { error });
        setCartCount(0);
        setCartTotal(0);
        setCartTotalCurrency('AMD');
      }
      return;
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setCartCount(0);
        setCartTotal(0);
        setCartTotalCurrency('AMD');
        return;
      }
    }

    try {
      const response = await apiClient.get<{
        cart: {
          itemsCount: number;
          totals: { total: number; currency?: string };
        };
      }>('/api/v1/cart');

      setCartCount(response.cart?.itemsCount || 0);
      setCartTotal(response.cart?.totals?.total || 0);
      setCartTotalCurrency(coerceCurrencyCode(response.cart?.totals?.currency, 'AMD'));
    } catch (error: unknown) {
      const err = error as { status?: number; statusCode?: number };
      if (err?.status !== 401 && err?.statusCode !== 401) {
        logger.error('Error fetching cart', { error });
      }
      setCartCount(0);
      setCartTotal(0);
      setCartTotalCurrency('AMD');
    }
  }, [authLoading, isLoggedIn]);

  useEffect(() => {
    const handleCartUpdate = (e: Event) => {
      if (authLoading) {
        return;
      }
      const detail = (e as CustomEvent)?.detail;
      if (detail?.optimisticAdd) {
        setCartCount((c) => c + (detail.optimisticAdd.quantity ?? 1));
        setCartTotal((tot) => tot + (detail.optimisticAdd.price ?? 0) * (detail.optimisticAdd.quantity ?? 1));
        return;
      }
      if (detail?.itemsCount !== undefined && detail?.total !== undefined) {
        setCartCount(detail.itemsCount);
        setCartTotal(detail.total);
        setCartTotalCurrency(coerceCurrencyCode(detail.currency, 'AMD'));
        return;
      }
      void fetchCart();
    };

    window.addEventListener('cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [authLoading, fetchCart]);

  useEffect(() => {
    if (authLoading) {
      setCartCount(0);
      setCartTotal(0);
      setCartTotalCurrency('AMD');
      return;
    }
    void fetchCart();
  }, [authLoading, isLoggedIn, fetchCart]);

  return { cartCount, cartTotal, cartTotalCurrency, fetchCart };
}

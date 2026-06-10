'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api-client';
import { coerceCurrencyCode, type CurrencyCode } from '../currency';
import { loadGuestCartTotals } from './guest-cart-totals';
import { queryKeys } from '../query-keys';
import { logger } from '../utils/logger';

export type CartSummaryState = {
  cartCount: number;
  cartTotal: number;
  cartTotalCurrency: CurrencyCode;
  fetchCart: () => Promise<void>;
};

export function useCartSummaryState(): CartSummaryState {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartTotalCurrency, setCartTotalCurrency] = useState<CurrencyCode>('AMD');

  const fetchCartTotals = useCallback(async (): Promise<{
    cart: {
      itemsCount: number;
      totals: { total: number; currency?: string };
    };
  }> => {
    if (authLoading) {
      return {
        cart: {
          itemsCount: 0,
          totals: { total: 0, currency: 'AMD' },
        },
      };
    }
    if (!isLoggedIn) {
      const { itemsCount, total } = await loadGuestCartTotals();
      return {
        cart: {
          itemsCount,
          totals: { total, currency: 'AMD' },
        },
      };
    }

    return apiClient.get<{
      cart: {
        itemsCount: number;
        totals: { total: number; currency?: string };
      };
    }>('/api/v1/cart');
  }, [authLoading, isLoggedIn]);

  const cartQuery = useQuery({
    queryKey: queryKeys.cartByAuth(isLoggedIn),
    queryFn: fetchCartTotals,
    enabled: !authLoading,
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    const payload = cartQuery.data?.cart;
    if (!payload) {
      return;
    }
    setCartCount(payload.itemsCount || 0);
    setCartTotal(payload.totals?.total || 0);
    setCartTotalCurrency(coerceCurrencyCode(payload.totals?.currency, 'AMD'));
  }, [cartQuery.data]);

  const fetchCart = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.cartByAuth(isLoggedIn) });
    } catch (error: unknown) {
      logger.error('Error invalidating cart query', { error });
    }
  }, [isLoggedIn, queryClient]);

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
      void queryClient.invalidateQueries({ queryKey: queryKeys.cartByAuth(isLoggedIn) });
    };

    window.addEventListener('cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [authLoading, isLoggedIn, queryClient]);

  useEffect(() => {
    if (!authLoading) {
      return;
    }
    setCartCount(0);
    setCartTotal(0);
    setCartTotalCurrency('AMD');
  }, [authLoading]);

  return { cartCount, cartTotal, cartTotalCurrency, fetchCart };
}

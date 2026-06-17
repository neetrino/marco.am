'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api-client';
import { coerceCurrencyCode, type CurrencyCode } from '../currency';
import { normalizeCartSummaryPayload } from './cart-summary-coerce';
import { loadGuestCartTotals } from './guest-cart-totals';
import { queryKeys } from '../query-keys';
import { logger } from '../utils/logger';

export type CartSummaryState = {
  cartCount: number;
  cartTotal: number;
  cartTotalCurrency: CurrencyCode;
  fetchCart: () => Promise<void>;
};

type CartSummaryQueryPayload = {
  cart: {
    itemsCount: number;
    totals: { total: number; currency?: string };
  };
};

export function useCartSummaryState(): CartSummaryState {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartTotalCurrency, setCartTotalCurrency] = useState<CurrencyCode>('AMD');

  const applySummary = useCallback(
    (raw: { itemsCount?: unknown; totals?: { total?: unknown; currency?: unknown } }) => {
      const summary = normalizeCartSummaryPayload(raw);
      setCartCount(summary.itemsCount);
      setCartTotal(summary.totals.total);
      setCartTotalCurrency(summary.totals.currency);
      return summary;
    },
    [],
  );

  const writeSummaryToQueryCache = useCallback(
    (summary: ReturnType<typeof normalizeCartSummaryPayload>) => {
      queryClient.setQueryData<CartSummaryQueryPayload>(queryKeys.cartByAuth(isLoggedIn), {
        cart: {
          itemsCount: summary.itemsCount,
          totals: {
            total: summary.totals.total,
            currency: summary.totals.currency,
          },
        },
      });
    },
    [isLoggedIn, queryClient],
  );

  const fetchCartTotals = useCallback(async (): Promise<CartSummaryQueryPayload> => {
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

    const response = await apiClient.get<CartSummaryQueryPayload>('/api/v1/cart', {
      params: { view: 'summary' },
    });
    const summary = normalizeCartSummaryPayload(response.cart);
    return {
      cart: {
        itemsCount: summary.itemsCount,
        totals: {
          total: summary.totals.total,
          currency: summary.totals.currency,
        },
      },
    };
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
    applySummary(payload);
  }, [applySummary, cartQuery.data]);

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
        setCartTotal(
          (tot) => tot + (detail.optimisticAdd.price ?? 0) * (detail.optimisticAdd.quantity ?? 1),
        );
        return;
      }
      if (detail?.itemsCount !== undefined && detail?.total !== undefined) {
        const summary = applySummary({
          itemsCount: detail.itemsCount,
          totals: { total: detail.total, currency: detail.currency },
        });
        writeSummaryToQueryCache(summary);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.cartByAuth(isLoggedIn) });
    };

    window.addEventListener('cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [applySummary, authLoading, isLoggedIn, queryClient, writeSummaryToQueryCache]);

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

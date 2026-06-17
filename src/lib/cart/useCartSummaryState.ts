'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api-client';
import type { CurrencyCode } from '../currency';
import { normalizeCartSummaryPayload } from './cart-summary-coerce';
import { loadGuestCartTotals, readGuestCartSummarySync } from './guest-cart-totals';
import { logger } from '../utils/logger';

export type CartSummaryState = {
  cartCount: number;
  cartTotal: number;
  cartTotalCurrency: CurrencyCode;
  fetchCart: () => Promise<void>;
};

type CartSummaryApiPayload = {
  cart: {
    itemsCount: number;
    totals: { total: number; currency?: string };
  };
};

type CartUpdateDetail = {
  optimisticAdd?: { quantity?: number; price?: number };
  itemsCount?: number;
  total?: number;
  currency?: string;
};

function guestSummaryPayload(totals: { itemsCount: number; total: number }) {
  return {
    itemsCount: totals.itemsCount,
    totals: { total: totals.total, currency: 'AMD' as const },
  };
}

export function useCartSummaryState(): CartSummaryState {
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartTotalCurrency, setCartTotalCurrency] = useState<CurrencyCode>('AMD');

  const applySummary = useCallback(
    (raw: { itemsCount?: unknown; totals?: { total?: unknown; currency?: unknown } }) => {
      const summary = normalizeCartSummaryPayload(raw);
      setCartCount(summary.itemsCount);
      setCartTotal(summary.totals.total);
      setCartTotalCurrency(summary.totals.currency);
    },
    [],
  );

  const applyGuestSummarySync = useCallback(() => {
    applySummary(guestSummaryPayload(readGuestCartSummarySync()));
  }, [applySummary]);

  const fetchLoggedInSummary = useCallback(async () => {
    try {
      const response = await apiClient.get<CartSummaryApiPayload>('/api/v1/cart', {
        params: { view: 'summary' },
      });
      applySummary(response.cart);
    } catch (error: unknown) {
      logger.error('Error fetching cart summary', { error });
    }
  }, [applySummary]);

  const fetchCart = useCallback(async () => {
    if (authLoading) {
      return;
    }
    if (!isLoggedIn) {
      const totals = await loadGuestCartTotals();
      applySummary(guestSummaryPayload(totals));
      return;
    }
    await fetchLoggedInSummary();
  }, [applySummary, authLoading, fetchLoggedInSummary, isLoggedIn]);

  useLayoutEffect(() => {
    if (isLoggedIn) {
      return;
    }
    applyGuestSummarySync();
  }, [applyGuestSummarySync, isLoggedIn]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (isLoggedIn) {
      void fetchLoggedInSummary();
      return;
    }
    applyGuestSummarySync();
    void loadGuestCartTotals().then((totals) => {
      applySummary(guestSummaryPayload(totals));
    });
  }, [applyGuestSummarySync, applySummary, authLoading, fetchLoggedInSummary, isLoggedIn]);

  useEffect(() => {
    const handleCartUpdate = (event: Event) => {
      const detail = (event as CustomEvent<CartUpdateDetail>).detail;

      if (detail?.optimisticAdd) {
        const qty = detail.optimisticAdd.quantity ?? 1;
        const price = detail.optimisticAdd.price ?? 0;
        setCartCount((count) => count + qty);
        setCartTotal((total) => total + price * qty);
        return;
      }

      if (detail?.itemsCount !== undefined && detail?.total !== undefined) {
        applySummary({
          itemsCount: detail.itemsCount,
          totals: { total: detail.total, currency: detail.currency },
        });
        return;
      }

      if (!isLoggedIn) {
        applyGuestSummarySync();
        return;
      }
      if (!authLoading) {
        void fetchLoggedInSummary();
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, [applyGuestSummarySync, applySummary, authLoading, fetchLoggedInSummary, isLoggedIn]);

  return { cartCount, cartTotal, cartTotalCurrency, fetchCart };
}

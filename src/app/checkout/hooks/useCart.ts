import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { fetchCartForGuest } from '../checkoutUtils';
import type { Cart } from '../types';

export function useCart(isLoggedIn: boolean, authLoading: boolean) {
  const { t } = useTranslation();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);

  const fetchCart = useCallback(async () => {
    if (authLoading) {
      return;
    }
    const generation = ++fetchGenerationRef.current;
    try {
      setLoading(true);

      if (isLoggedIn) {
        const response = await apiClient.get<{ cart: Cart }>('/api/v1/cart');
        if (generation !== fetchGenerationRef.current) {
          return;
        }
        setCart(response.cart);
        return;
      }

      const guestCart = await fetchCartForGuest();
      if (generation !== fetchGenerationRef.current) {
        return;
      }
      setCart(guestCart);
    } catch {
      if (generation === fetchGenerationRef.current) {
        setError(t('checkout.errors.failedToLoadCart'));
      }
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [authLoading, isLoggedIn, t]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    void fetchCart();
  }, [authLoading, fetchCart]);

  return { cart, loading, error, setError, fetchCart };
}


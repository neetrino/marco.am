'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getStoredCurrency } from '../../lib/currency';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';
import type { Cart } from './types';
import { fetchCart } from './cart-fetcher';
import { handleRemoveItem, handleUpdateQuantity } from './cart-handlers';
import { CartTable, OrderSummary } from './cart-components';
import { EmptyCart } from './empty-cart';
import { LoadingState } from './loading-state';

export default function CartPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  // Track if we updated locally to prevent unnecessary re-fetch
  const isLocalUpdateRef = useRef(false);
  /** Ignores guest-cart fetches that finish after auth resolved to logged-in (or vice versa). */
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
      // If we just updated locally, skip re-fetch to avoid page reload
      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false;
        return;
      }
      
      // Only re-fetch if update came from external source (another component)
      void loadCart();
    };

    const handleAuthUpdate = () => {
      void loadCart();
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('auth-updated', handleAuthUpdate);

    if (!authLoading) {
      void loadCart();
    }

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('auth-updated', handleAuthUpdate);
    };
  }, [authLoading, loadCart]);

  async function onRemoveItem(itemId: string) {
    if (!cart) return;
    
    // Mark as local update to prevent re-fetch in event handler
    isLocalUpdateRef.current = true;
    
    await handleRemoveItem(itemId, cart, isLoggedIn, setCart, loadCart);
  }

  async function onUpdateQuantity(itemId: string, quantity: number) {
    // Mark as local update to prevent re-fetch in event handler
    isLocalUpdateRef.current = true;
    
    await handleUpdateQuantity(
      itemId,
      quantity,
      cart,
      isLoggedIn,
      setCart,
      setUpdatingItems,
      loadCart,
      t
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!cart || cart.items.length === 0) {
    return <EmptyCart t={t} />;
  }

  return (
    <div className="marco-header-container py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('common.cart.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <CartTable
          cart={cart}
          currency={currency}
          updatingItems={updatingItems}
          onRemove={onRemoveItem}
          onUpdateQuantity={onUpdateQuantity}
          t={t}
        />
        <OrderSummary cart={cart} currency={currency} t={t} />
      </div>
    </div>
  );
}

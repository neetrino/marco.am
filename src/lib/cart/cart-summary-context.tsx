'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useCartSummaryState, type CartSummaryState } from './useCartSummaryState';

const CartSummaryContext = createContext<CartSummaryState | null>(null);

export function CartSummaryProvider({ children }: { children: ReactNode }) {
  const value = useCartSummaryState();
  return <CartSummaryContext.Provider value={value}>{children}</CartSummaryContext.Provider>;
}

export function useCartSummary(): CartSummaryState {
  const ctx = useContext(CartSummaryContext);
  if (!ctx) {
    throw new Error('useCartSummary must be used within CartSummaryProvider');
  }
  return ctx;
}

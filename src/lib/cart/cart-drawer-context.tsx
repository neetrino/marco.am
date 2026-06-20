'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CartDrawer } from '../../components/cart/CartDrawer';

const CART_DRAWER_OPEN_EVENT = 'cart-drawer-open';

interface CartDrawerContextValue {
  isOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

/** Opens the cart drawer from anywhere (e.g. reorder flows without a hook). */
export function dispatchOpenCartDrawer(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(CART_DRAWER_OPEN_EVENT));
}

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openCartDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCartDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener(CART_DRAWER_OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener(CART_DRAWER_OPEN_EVENT, handleOpen);
    };
  }, []);

  const value = useMemo(
    () => ({ isOpen, openCartDrawer, closeCartDrawer }),
    [closeCartDrawer, isOpen, openCartDrawer],
  );

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer(): CartDrawerContextValue {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) {
    throw new Error('useCartDrawer must be used within CartDrawerProvider');
  }
  return ctx;
}

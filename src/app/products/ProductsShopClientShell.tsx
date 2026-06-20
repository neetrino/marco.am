'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ProductsShopPlpShellProvider } from '@/lib/products-shop-plp-shell-context';
import { PRODUCTS_PLP_TOTAL_EVENT } from '@/lib/products-plp-total-event';

type ProductsShopClientShellProps = {
  readonly children: ReactNode;
};

/**
 * PLP shell — provides streamed total count for page title accessibility.
 * Visual title lives in the filter column / mobile listing header.
 */
export function ProductsShopClientShell({ children }: ProductsShopClientShellProps) {
  const [total, setTotal] = useState<number | undefined>(undefined);

  useEffect(() => {
    const onTotal = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === 'number' && Number.isFinite(detail)) {
        setTotal(detail);
      }
    };
    window.addEventListener(PRODUCTS_PLP_TOTAL_EVENT, onTotal);
    return () => {
      window.removeEventListener(PRODUCTS_PLP_TOTAL_EVENT, onTotal);
    };
  }, []);

  return (
    <ProductsShopPlpShellProvider total={total}>
      <div className="w-full max-w-full pb-4 md:pb-32 lg:pb-40">
        {children}
      </div>
    </ProductsShopPlpShellProvider>
  );
}

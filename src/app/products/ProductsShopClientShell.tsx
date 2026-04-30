'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ProductsHeader } from '@/components/ProductsHeader';
import { PRODUCTS_PLP_TOTAL_EVENT } from '@/lib/products-plp-total-event';

type ProductsShopClientShellProps = {
  readonly children: ReactNode;
};

/**
 * Renders the PLP header immediately; listing Suspense streams below.
 * Total count is patched when `ProductsPlpTotalReporter` runs after the server fetch.
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
    <div className="w-full max-w-full pb-4 md:pb-32 lg:pb-40">
      <ProductsHeader total={total} />
      {children}
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { PRODUCTS_PLP_TOTAL_EVENT } from '@/lib/products-plp-total-event';

type ProductsPlpTotalReporterProps = {
  readonly total: number;
};

/**
 * Notifies `ProductsShopClientShell` so `ProductsHeader` can show meta.total without blocking on listing fetch.
 */
export function ProductsPlpTotalReporter({ total }: ProductsPlpTotalReporterProps) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent<number>(PRODUCTS_PLP_TOTAL_EVENT, { detail: total }));
  }, [total]);
  return null;
}

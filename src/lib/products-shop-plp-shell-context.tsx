'use client';

import { createContext, useContext, type ReactNode } from 'react';

type ProductsShopPlpShellContextValue = {
  readonly total?: number;
};

const ProductsShopPlpShellContext = createContext<ProductsShopPlpShellContextValue>({});

type ProductsShopPlpShellProviderProps = {
  readonly total?: number;
  readonly children: ReactNode;
};

export function ProductsShopPlpShellProvider({ total, children }: ProductsShopPlpShellProviderProps) {
  return (
    <ProductsShopPlpShellContext.Provider value={{ total }}>
      {children}
    </ProductsShopPlpShellContext.Provider>
  );
}

export function useProductsShopPlpShell(): ProductsShopPlpShellContextValue {
  return useContext(ProductsShopPlpShellContext);
}

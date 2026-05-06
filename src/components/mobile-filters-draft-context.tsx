'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface MobileFiltersDraftContextValue {
  readonly enabled: boolean;
  readonly searchParams: URLSearchParams;
  readonly updateSearchParams: (updater: (params: URLSearchParams) => void) => void;
}

const MobileFiltersDraftContext = createContext<MobileFiltersDraftContextValue | null>(null);

interface MobileFiltersDraftProviderProps {
  readonly value: MobileFiltersDraftContextValue;
  readonly children: ReactNode;
}

export function MobileFiltersDraftProvider({ value, children }: MobileFiltersDraftProviderProps) {
  return (
    <MobileFiltersDraftContext.Provider value={value}>
      {children}
    </MobileFiltersDraftContext.Provider>
  );
}

export function useMobileFiltersDraft(): MobileFiltersDraftContextValue | null {
  return useContext(MobileFiltersDraftContext);
}

'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type ProductsViewMode = 'list' | 'grid-2' | 'grid-3';

const STORAGE_KEY = 'products-view-mode';
const VALID_MODES: readonly ProductsViewMode[] = ['list', 'grid-2', 'grid-3'];

function parseStoredMode(raw: string | null): ProductsViewMode {
  if (raw && (VALID_MODES as readonly string[]).includes(raw)) {
    return raw as ProductsViewMode;
  }
  return 'grid-2';
}

function subscribe(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();
  window.addEventListener('storage', handler);
  window.addEventListener('view-mode-changed', handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('view-mode-changed', handler);
  };
}

function getServerSnapshot(): ProductsViewMode {
  return 'grid-2';
}

function getClientSnapshot(): ProductsViewMode {
  return parseStoredMode(localStorage.getItem(STORAGE_KEY));
}

/**
 * Syncs products list/grid view mode with localStorage and cross-tab updates.
 */
export function useProductsViewMode(): [ProductsViewMode, (mode: ProductsViewMode) => void] {
  const viewMode = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const setViewMode = useCallback((mode: ProductsViewMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent('view-mode-changed', { detail: mode }));
  }, []);

  return [viewMode, setViewMode];
}

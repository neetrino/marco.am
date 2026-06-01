'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SHOP_PRODUCTS_LISTING_PARAMS_EVENT,
  dispatchShopProductsListingParams,
  type ShopProductsListingParamsDetail,
} from '@/lib/shop-products-listing-params-event';

type Listener = () => void;

let clientQueryString = '';
const listeners = new Set<Listener>();

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

/** Keeps client-only PLP URL updates in sync with filter/listing consumers. */
export function syncShopProductsListingQueryString(queryString: string): void {
  if (clientQueryString === queryString) {
    return;
  }
  clientQueryString = queryString;
  notifyListeners();
}

function readClientQueryString(fallbackQueryString: string): string {
  if (clientQueryString) {
    return clientQueryString;
  }
  if (typeof window !== 'undefined') {
    return window.location.search.startsWith('?')
      ? window.location.search.slice(1)
      : window.location.search;
  }
  return fallbackQueryString;
}

let popstateListenerInstalled = false;

function ensurePopstateListener(): void {
  if (popstateListenerInstalled || typeof window === 'undefined') {
    return;
  }
  popstateListenerInstalled = true;
  window.addEventListener('popstate', () => {
    const href = `${window.location.pathname}${window.location.search}`;
    dispatchShopProductsListingParams(href);
    syncShopProductsListingQueryString(
      window.location.search.startsWith('?')
        ? window.location.search.slice(1)
        : window.location.search,
    );
  });
}

/**
 * PLP listing query string synced via history.pushState (no App Router refetch).
 * Falls back to Next `useSearchParams` on first paint and full navigations.
 */
export function useShopProductsListingSearchParams(): URLSearchParams {
  const nextSearchParams = useSearchParams();
  const nextQueryString = nextSearchParams.toString();

  useEffect(() => {
    syncShopProductsListingQueryString(nextQueryString);
  }, [nextQueryString]);

  useEffect(() => {
    ensurePopstateListener();
    const onListingParams = (event: Event) => {
      const detail = (event as CustomEvent<ShopProductsListingParamsDetail>).detail;
      syncShopProductsListingQueryString(detail.queryString);
    };
    window.addEventListener(SHOP_PRODUCTS_LISTING_PARAMS_EVENT, onListingParams);
    return () => {
      window.removeEventListener(SHOP_PRODUCTS_LISTING_PARAMS_EVENT, onListingParams);
    };
  }, []);

  const queryString = useSyncExternalStore(
    subscribe,
    () => readClientQueryString(nextQueryString),
    () => nextQueryString,
  );

  return useMemo(() => new URLSearchParams(queryString), [queryString]);
}

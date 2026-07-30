'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { warmReelsPageClientCache } from '@/lib/reels-page-prefetch';
import { getStoredLanguage } from '@/lib/language';
import { warmShopProductsClientCaches } from '@/lib/shop-products-plp-prefetch';

const PRODUCTS_SHOP_PATH = '/products';
const REELS_PATH = '/reels';
const INTERACTION_PREFETCH_MAX_SEGMENTS = 2;
const HOME_PATH = '/';
const INTERACTION_PRODUCTS_WARM_TIMEOUT_MS = 8_000;

function shouldSkipIdlePrefetch(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection as
    | { saveData?: boolean; effectiveType?: string }
    | undefined;
  if (!connection) {
    return false;
  }
  return Boolean(connection.saveData) || connection.effectiveType === 'slow-2g';
}

type PrefetchableInternalRoute = {
  pathname: string;
  queryString: string;
  prefetchKey: string;
};

function parsePrefetchableInternalRoute(href: string): PrefetchableInternalRoute | null {
  try {
    const parsed = new URL(href, window.location.origin);
    if (parsed.origin !== window.location.origin) {
      return null;
    }
    if (parsed.pathname.startsWith('/api/')) {
      return null;
    }
    const queryString = parsed.search.startsWith('?') ? parsed.search.slice(1) : parsed.search;
    return {
      pathname: parsed.pathname,
      queryString,
      prefetchKey: `${parsed.pathname}?${queryString}`,
    };
  } catch {
    return null;
  }
}

function shouldInteractionPrefetch(pathname: string): boolean {
  if (pathname === HOME_PATH) {
    return false;
  }
  if (pathname.startsWith(`${PRODUCTS_SHOP_PATH}/`)) {
    return false;
  }
  const segments = pathname.split('/').filter(Boolean);
  return segments.length <= INTERACTION_PREFETCH_MAX_SEGMENTS;
}

function isBrandFilteredProductsRoute(queryString: string): boolean {
  if (!queryString) {
    return false;
  }
  return new URLSearchParams(queryString).has('brand');
}

/**
 * Prefetches routes and warms PLP/reels client caches only on link interaction (pointer/focus).
 */
export function GlobalRoutePrefetch() {
  const router = useRouter();
  const interactionWarmedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const prefetchFromElement = (target: EventTarget | null) => {
      if (shouldSkipIdlePrefetch()) {
        return;
      }
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      if (anchor.hasAttribute('data-brand-plp-link')) {
        return;
      }
      const href = anchor.getAttribute('href');
      if (!href) {
        return;
      }
      const route = parsePrefetchableInternalRoute(href);
      if (!route || !shouldInteractionPrefetch(route.pathname)) {
        return;
      }
      if (interactionWarmedRef.current.has(route.prefetchKey)) {
        return;
      }
      interactionWarmedRef.current.add(route.prefetchKey);
      if (
        route.pathname === PRODUCTS_SHOP_PATH &&
        isBrandFilteredProductsRoute(route.queryString)
      ) {
        return;
      }
      void router.prefetch(
        route.queryString ? `${route.pathname}?${route.queryString}` : route.pathname,
      );
      const language = getStoredLanguage();
      if (route.pathname === PRODUCTS_SHOP_PATH) {
        warmShopProductsClientCaches(language, route.queryString, {
          timeoutMs: INTERACTION_PRODUCTS_WARM_TIMEOUT_MS,
          includeCategories: true,
          suppressTimeoutLogging: true,
        });
      }
      if (route.pathname === REELS_PATH) {
        warmReelsPageClientCache(language);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      prefetchFromElement(event.target);
    };
    const onFocusIn = (event: FocusEvent) => {
      prefetchFromElement(event.target);
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('focusin', onFocusIn, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [router]);

  return null;
}

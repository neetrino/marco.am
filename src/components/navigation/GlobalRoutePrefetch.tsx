'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { warmReelsPageClientCache } from '@/lib/reels-page-prefetch';
import { getStoredLanguage } from '@/lib/language';
import { warmShopProductsClientCaches } from '@/lib/shop-products-plp-prefetch';

const EXTRA_PREFETCH_ROUTES = ['/wishlist', '/profile', '/login'] as const;
/** Lightweight marketing routes — prefetch first so About/Contact/Reels open instantly. */
const LIGHT_MARKETING_ROUTES = ['/', '/about', '/contact', '/reels', '/compare', '/brands', '/products'] as const;
const PRODUCTS_SHOP_PATH = '/products';
const REELS_PATH = '/reels';
const INTERACTION_PREFETCH_MAX_SEGMENTS = 2;
const HOME_PATH = '/';
const INTERACTION_PRODUCTS_WARM_TIMEOUT_MS = 8_000;
const STAGGER_PREFETCH_DELAY_MS = 100;
const IDLE_PREFETCH_TIMEOUT_MS = 4_000;
const MARKETING_IDLE_WARM_DELAY_MS = 800;

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

type AppRouter = ReturnType<typeof useRouter>;

function scheduleIdleTask(task: () => void, timeoutMs: number): () => void {
  if (typeof requestIdleCallback !== 'undefined') {
    const id = requestIdleCallback(task, { timeout: timeoutMs });
    return () => cancelIdleCallback(id);
  }
  const timer = window.setTimeout(task, timeoutMs);
  return () => window.clearTimeout(timer);
}

function prefetchRouteIfNeeded(
  route: string,
  pathname: string,
  router: AppRouter,
  warmedRef: MutableRefObject<Set<string>>,
): void {
  if (route === pathname || warmedRef.current.has(route)) {
    return;
  }
  warmedRef.current.add(route);
  void router.prefetch(route);
}

function prefetchRoutesStaggered(
  routes: readonly string[],
  pathname: string,
  router: AppRouter,
  warmedRef: MutableRefObject<Set<string>>,
): () => void {
  const timers: number[] = [];
  let staggerIndex = 0;
  for (const route of routes) {
    if (route === pathname || warmedRef.current.has(route)) {
      continue;
    }
    warmedRef.current.add(route);
    const delay = staggerIndex * STAGGER_PREFETCH_DELAY_MS;
    staggerIndex += 1;
    timers.push(
      window.setTimeout(() => {
        void router.prefetch(route);
      }, delay),
    );
  }
  return () => {
    for (const timer of timers) {
      window.clearTimeout(timer);
    }
  };
}

/**
 * Prefetches high-traffic routes on idle; API payloads warm only on link interaction.
 */
export function GlobalRoutePrefetch() {
  const pathname = usePathname();
  const router = useRouter();
  const warmedRef = useRef<Set<string>>(new Set());
  const interactionWarmedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (shouldSkipIdlePrefetch()) {
      return;
    }

    const cancelLight = prefetchRoutesStaggered(
      LIGHT_MARKETING_ROUTES,
      pathname,
      router,
      warmedRef,
    );
    const cancelHeavy = scheduleIdleTask(() => {
      for (const route of EXTRA_PREFETCH_ROUTES) {
        prefetchRouteIfNeeded(route, pathname, router, warmedRef);
      }
    }, IDLE_PREFETCH_TIMEOUT_MS);

    return () => {
      cancelLight();
      cancelHeavy();
    };
  }, [pathname, router]);

  useEffect(() => {
    if (shouldSkipIdlePrefetch()) {
      return;
    }
    const language = getStoredLanguage();
    const cancelWarm = scheduleIdleTask(() => {
      if (pathname !== REELS_PATH) {
        warmReelsPageClientCache(language);
      }
      if (pathname !== PRODUCTS_SHOP_PATH) {
        warmShopProductsClientCaches(language, '', {
          includeCategories: true,
          suppressTimeoutLogging: true,
        });
      }
    }, MARKETING_IDLE_WARM_DELAY_MS);
    return cancelWarm;
  }, [pathname]);

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

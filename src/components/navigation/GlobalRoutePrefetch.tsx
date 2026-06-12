'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { primaryNavInternalHrefs } from '@/components/header/nav-config';
import { warmBrandsPageClientCache } from '@/lib/brands-page-prefetch';
import { warmReelsPageClientCache } from '@/lib/reels-page-prefetch';
import { getStoredLanguage } from '@/lib/language';
import { warmShopProductsClientCaches } from '@/lib/shop-products-plp-prefetch';
import type { LanguageCode } from '@/lib/language';

const EXTRA_PREFETCH_ROUTES = ['/wishlist', '/profile', '/login'] as const;
const PREFETCH_ROUTES = [...new Set([...primaryNavInternalHrefs, ...EXTRA_PREFETCH_ROUTES])];
/** Header routes warmed first so dev compile starts before the user clicks. */
const PRIORITY_PREFETCH_ROUTES = [...primaryNavInternalHrefs];
const PRODUCTS_SHOP_PATH = '/products';
const BRANDS_PATH = '/brands';
const REELS_PATH = '/reels';
const INTERACTION_PREFETCH_MAX_SEGMENTS = 2;
/** Home SSR already loads product rails + brand partners — defer API warm to avoid DB spikes. */
const HOME_API_WARM_DEFER_MS = 12_000;
const HOME_PATH = '/';
const INTERACTION_PRODUCTS_WARM_TIMEOUT_MS = 8_000;
type IdleCapableWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

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

function warmProductsApi(
  language: LanguageCode,
  options?: {
    timeoutMs?: number;
    includeCategories?: boolean;
    suppressTimeoutLogging?: boolean;
  },
): void {
  warmShopProductsClientCaches(language, '', options);
}

function warmBrandPartnersApi(
  language: LanguageCode,
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  warmBrandsPageClientCache(queryClient, language);
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
  const segments = pathname.split('/').filter(Boolean);
  return segments.length <= INTERACTION_PREFETCH_MAX_SEGMENTS;
}

function scheduleIdleWork(run: () => void, timeoutMs: number): () => void {
  const idleWindow = window as IdleCapableWindow;
  if (typeof idleWindow.requestIdleCallback === 'function') {
    const id = idleWindow.requestIdleCallback(run, { timeout: timeoutMs });
    return () => {
      if (typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(id);
      }
    };
  }
  const timerId = globalThis.setTimeout(run, Math.min(timeoutMs, 3000));
  return () => globalThis.clearTimeout(timerId);
}

/**
 * Prefetches high-traffic routes + public products payload during idle time.
 */
export function GlobalRoutePrefetch() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const warmedRef = useRef<Set<string>>(new Set());
  const interactionWarmedRef = useRef<Set<string>>(new Set());
  const warmProductsLangRef = useRef<Set<string>>(new Set());
  const routesToPrefetch = useMemo(
    () => PREFETCH_ROUTES.filter((route) => route !== pathname),
    [pathname],
  );

  useEffect(() => {
    if (shouldSkipIdlePrefetch()) {
      return;
    }
    for (const route of PRIORITY_PREFETCH_ROUTES) {
      if (warmedRef.current.has(route)) {
        continue;
      }
      warmedRef.current.add(route);
      void router.prefetch(route);
      if (route === PRODUCTS_SHOP_PATH) {
        warmProductsApi(getStoredLanguage(), {
          timeoutMs: INTERACTION_PRODUCTS_WARM_TIMEOUT_MS,
          suppressTimeoutLogging: true,
        });
      }
      if (route === BRANDS_PATH) {
        warmBrandsPageClientCache(queryClient, getStoredLanguage());
      }
      if (route === REELS_PATH) {
        warmReelsPageClientCache(getStoredLanguage());
      }
    }
  }, [queryClient, router]);

  useEffect(() => {
    if (shouldSkipIdlePrefetch()) {
      return;
    }

    for (const route of routesToPrefetch) {
      if (warmedRef.current.has(route)) {
        continue;
      }
      warmedRef.current.add(route);
      void router.prefetch(route);
    }

    const warmApi = () => {
      const language = getStoredLanguage();
      if (!warmProductsLangRef.current.has(language)) {
        warmProductsLangRef.current.add(language);
        warmProductsApi(language);
        warmBrandPartnersApi(language, queryClient);
        warmReelsPageClientCache(language);
      }
    };

    const apiWarmCancel =
      pathname === HOME_PATH
        ? scheduleIdleWork(warmApi, HOME_API_WARM_DEFER_MS)
        : scheduleIdleWork(warmApi, 2500);

    return apiWarmCancel;
  }, [queryClient, router, routesToPrefetch, pathname]);

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
      void router.prefetch(route.pathname);
      const language = getStoredLanguage();
      if (route.pathname === PRODUCTS_SHOP_PATH) {
        warmShopProductsClientCaches(language, route.queryString, {
          timeoutMs: INTERACTION_PRODUCTS_WARM_TIMEOUT_MS,
          includeCategories: false,
          suppressTimeoutLogging: true,
        });
      }
      if (route.pathname === BRANDS_PATH) {
        warmBrandsPageClientCache(queryClient, language);
      }
      if (route.pathname === REELS_PATH) {
        warmReelsPageClientCache(language);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      prefetchFromElement(event.target);
    };
    const onPointerOver = (event: PointerEvent) => {
      prefetchFromElement(event.target);
    };
    const onFocusIn = (event: FocusEvent) => {
      prefetchFromElement(event.target);
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('focusin', onFocusIn, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [queryClient, router]);

  return null;
}

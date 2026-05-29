'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredLanguage } from '@/lib/language';

const PREFETCH_ROUTES = ['/', '/products', '/wishlist', '/profile', '/reels'] as const;
const PRODUCTS_PREFETCH_QUERY = 'page=1&limit=12&listingOmitProductAttributes=1';
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

function warmProductsApi(language: string): void {
  const url = `/api/v1/products?${PRODUCTS_PREFETCH_QUERY}&lang=${encodeURIComponent(language)}`;
  void fetch(url, { cache: 'force-cache' });
  void fetch(`/api/v1/products/filters?lang=${encodeURIComponent(language)}`, { cache: 'force-cache' });
}

/**
 * Prefetches high-traffic routes + public products payload during idle time.
 */
export function GlobalRoutePrefetch() {
  const pathname = usePathname();
  const router = useRouter();
  const warmedRef = useRef<Set<string>>(new Set());
  const interactionWarmedRef = useRef<Set<string>>(new Set());
  const routesToPrefetch = useMemo(
    () => PREFETCH_ROUTES.filter((route) => route !== pathname),
    [pathname],
  );

  useEffect(() => {
    if (shouldSkipIdlePrefetch()) {
      return;
    }
    const idleWindow = window as IdleCapableWindow;
    const run = () => {
      for (const route of routesToPrefetch) {
        if (warmedRef.current.has(route)) {
          continue;
        }
        warmedRef.current.add(route);
        void router.prefetch(route);
      }
      warmProductsApi(getStoredLanguage());
    };
    if (typeof idleWindow.requestIdleCallback === 'function') {
      const id = idleWindow.requestIdleCallback(run, { timeout: 2500 });
      return () => {
        if (typeof idleWindow.cancelIdleCallback === 'function') {
          idleWindow.cancelIdleCallback(id);
        }
      };
    }
    const timerId = globalThis.setTimeout(run, 450);
    return () => globalThis.clearTimeout(timerId);
  }, [router, routesToPrefetch]);

  useEffect(() => {
    const prefetchFromElement = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/')) {
        return;
      }
      if (href.startsWith('//') || href.startsWith('/api/')) {
        return;
      }
      if (interactionWarmedRef.current.has(href)) {
        return;
      }
      interactionWarmedRef.current.add(href);
      void router.prefetch(href);
    };

    const onPointerMove = (event: PointerEvent) => {
      prefetchFromElement(event.target);
    };
    const onFocusIn = (event: FocusEvent) => {
      prefetchFromElement(event.target);
    };
    const onPointerDown = (event: PointerEvent) => {
      prefetchFromElement(event.target);
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('focusin', onFocusIn, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [router]);

  return null;
}

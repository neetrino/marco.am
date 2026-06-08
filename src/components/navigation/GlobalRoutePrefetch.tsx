'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { primaryNavInternalHrefs } from '@/components/header/nav-config';
import {
  fetchHomeBrandPartnersClient,
  HOME_BRAND_PARTNERS_QUERY_STALE_MS,
} from '@/lib/home-brand-partners-client';
import { getStoredLanguage } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';

const EXTRA_PREFETCH_ROUTES = ['/wishlist', '/profile', '/login'] as const;
const PREFETCH_ROUTES = [...new Set([...primaryNavInternalHrefs, ...EXTRA_PREFETCH_ROUTES])];
/** Header routes warmed first so dev compile starts before the user clicks. */
const PRIORITY_PREFETCH_ROUTES = [...primaryNavInternalHrefs];
const PRODUCTS_PREFETCH_QUERY = 'page=1&limit=12&listingOmitProductAttributes=1';
const INTERACTION_PREFETCH_MAX_SEGMENTS = 2;
/** Home SSR already loads product rails + brand partners — defer API warm to avoid DB spikes. */
const HOME_API_WARM_DEFER_MS = 12_000;
const HOME_PATH = '/';
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

function warmBrandPartnersApi(language: string, prefetchBrandPartners: () => void): void {
  prefetchBrandPartners();
  void fetch(`/api/v1/home/brand-partners?locale=${encodeURIComponent(language)}`, {
    cache: 'force-cache',
  });
}

function getPrefetchableInternalPath(href: string): string | null {
  try {
    const parsed = new URL(href, window.location.origin);
    if (parsed.origin !== window.location.origin) {
      return null;
    }
    if (parsed.pathname.startsWith('/api/')) {
      return null;
    }
    return parsed.pathname;
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
    }
  }, [router]);

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
        warmBrandPartnersApi(language, () => {
          void queryClient.prefetchQuery({
            queryKey: queryKeys.homeBrandPartners(language),
            queryFn: () => fetchHomeBrandPartnersClient(language),
            staleTime: HOME_BRAND_PARTNERS_QUERY_STALE_MS,
          });
        });
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
      const internalPath = getPrefetchableInternalPath(href);
      if (!internalPath || !shouldInteractionPrefetch(internalPath)) {
        return;
      }
      if (interactionWarmedRef.current.has(internalPath)) {
        return;
      }
      interactionWarmedRef.current.add(internalPath);
      void router.prefetch(internalPath);
    };

    const onPointerOver = (event: PointerEvent) => {
      prefetchFromElement(event.target);
    };
    const onFocusIn = (event: FocusEvent) => {
      prefetchFromElement(event.target);
    };
    const onPointerDown = (event: PointerEvent) => {
      prefetchFromElement(event.target);
    };

    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('focusin', onFocusIn, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });

    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [router]);

  return null;
}

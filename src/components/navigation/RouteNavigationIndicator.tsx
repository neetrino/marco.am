'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SHOP_PRODUCTS_LISTING_PARAMS_EVENT } from '@/lib/shop-products-listing-params-event';

function isFullRouteNavigation(event: MouseEvent, pathname: string): boolean {
  if (event.defaultPrevented || event.button !== 0) {
    return false;
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }
  const anchor = target.closest('a[href]');
  if (!(anchor instanceof HTMLAnchorElement)) {
    return false;
  }
  if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
    return false;
  }
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#')) {
    return false;
  }
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) {
      return false;
    }
    // Query-only changes (PLP pagination/filters via pushState) are not App Router transitions.
    return url.pathname !== pathname;
  } catch {
    return false;
  }
}

/**
 * Thin top bar shown during in-app pathname transitions (before the route finishes loading).
 */
export function RouteNavigationIndicator() {
  const pathname = usePathname() ?? '';
  const [pending, setPending] = useState(false);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    const markPending = (event: MouseEvent) => {
      if (isFullRouteNavigation(event, pathname)) {
        setPending(true);
      }
    };

    document.addEventListener('pointerdown', markPending, true);
    document.addEventListener('click', markPending, true);
    return () => {
      document.removeEventListener('pointerdown', markPending, true);
      document.removeEventListener('click', markPending, true);
    };
  }, [pathname]);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      setPending(false);
    }
  }, [pathname]);

  useEffect(() => {
    const clearPending = () => {
      setPending(false);
    };
    window.addEventListener(SHOP_PRODUCTS_LISTING_PARAMS_EVENT, clearPending);
    window.addEventListener('popstate', clearPending);
    return () => {
      window.removeEventListener(SHOP_PRODUCTS_LISTING_PARAMS_EVENT, clearPending);
      window.removeEventListener('popstate', clearPending);
    };
  }, []);

  if (!pending) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-1 overflow-hidden"
      aria-hidden
    >
      <div className="route-nav-indicator-bar h-full w-1/3 bg-marco-yellow" />
    </div>
  );
}

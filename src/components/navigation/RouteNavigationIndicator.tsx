'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

function isInternalNavEvent(event: MouseEvent, pathname: string): boolean {
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
    const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
    return url.pathname !== pathname || url.search !== currentSearch;
  } catch {
    return false;
  }
}

/**
 * Thin top bar shown as soon as an in-app link is clicked, before the route finishes loading.
 */
export function RouteNavigationIndicator() {
  const pathname = usePathname() ?? '';
  const [pending, setPending] = useState(false);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    const markPending = (event: MouseEvent) => {
      if (isInternalNavEvent(event, pathname)) {
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

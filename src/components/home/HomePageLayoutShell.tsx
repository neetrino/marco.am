'use client';

import { useLayoutEffect, type ReactNode } from 'react';

/** Present while `/` is mounted — usable for route-scoped CSS without flash before paint. */
const HOME_ROUTE_DOCUMENT_ATTR = 'data-marco-home';

/**
 * Marks the document and prepares the home subtree before the browser paints, so the full page
 * shell (hero + suspense fallbacks) lays out without a post-paint correction flash.
 */
export function HomePageLayoutShell({ children }: { readonly children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute(HOME_ROUTE_DOCUMENT_ATTR, '');
    return () => {
      root.removeAttribute(HOME_ROUTE_DOCUMENT_ATTR);
    };
  }, []);

  return (
    <div className="home-page-layout-root flex min-h-screen min-h-[100dvh] flex-col">
      {children}
    </div>
  );
}

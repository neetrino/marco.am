import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { ADMIN_PANEL_ROUTES, ADMIN_PRIORITY_PREFETCH_ROUTES } from '@/lib/admin/admin-nav-routes';

const prefetchedRoutes = new Set<string>();

/** Prefetches a single admin route (deduped per session). */
export function prefetchAdminRoute(router: AppRouterInstance, href: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const path = href.split('?')[0] ?? href;
  if (prefetchedRoutes.has(path)) {
    return;
  }
  prefetchedRoutes.add(path);
  void router.prefetch(path);
}

/** Prefetches all admin routes immediately (no idle delay). */
export function prefetchAllAdminRoutes(
  router: AppRouterInstance,
  currentPath?: string,
): void {
  for (const route of ADMIN_PANEL_ROUTES) {
    if (route !== currentPath) {
      prefetchAdminRoute(router, route);
    }
  }
}

/** Priority prefetch + warm remaining admin routes immediately. */
export function warmAdminRoutePrefetches(
  router: AppRouterInstance,
  currentPath: string,
): () => void {
  for (const route of ADMIN_PRIORITY_PREFETCH_ROUTES) {
    if (route !== currentPath) {
      prefetchAdminRoute(router, route);
    }
  }
  prefetchAllAdminRoutes(router, currentPath);
  return () => undefined;
}

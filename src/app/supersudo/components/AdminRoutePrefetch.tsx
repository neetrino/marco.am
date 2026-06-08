'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { warmAdminPageCaches } from '@/lib/admin/admin-page-warm';
import { warmAdminRoutePrefetches } from '@/lib/admin/admin-route-prefetch';

/**
 * Warms admin RSC chunks and hot API caches after auth — faster sidebar navigation.
 */
export function AdminRoutePrefetch() {
  const pathname = usePathname() ?? '/supersudo';
  const router = useRouter();

  useLayoutEffect(() => {
    warmAdminPageCaches();
  }, []);

  useEffect(() => {
    const cancelIdle = warmAdminRoutePrefetches(router, pathname);
    warmAdminPageCaches();
    return cancelIdle;
  }, [pathname, router]);

  return null;
}

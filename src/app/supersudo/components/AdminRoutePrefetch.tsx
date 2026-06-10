'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { warmAdminPageCacheForPath } from '@/lib/admin/admin-page-warm';
import { warmAdminRoutePrefetches } from '@/lib/admin/admin-route-prefetch';

/**
 * Warms admin RSC chunks and hot API caches after auth — faster sidebar navigation.
 */
export function AdminRoutePrefetch() {
  const pathname = usePathname() ?? '/supersudo';
  const router = useRouter();

  useLayoutEffect(() => {
    warmAdminPageCacheForPath(pathname);
  }, [pathname]);

  useEffect(() => {
    const cancelIdle = warmAdminRoutePrefetches(router, pathname);
    return cancelIdle;
  }, [pathname, router]);

  return null;
}

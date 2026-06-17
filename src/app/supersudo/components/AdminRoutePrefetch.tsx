'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { warmAdminRoutePrefetches } from '@/lib/admin/admin-route-prefetch';

/**
 * Prefetches admin RSC chunks after auth — API warm runs on sidebar hover/click only.
 */
export function AdminRoutePrefetch() {
  const pathname = usePathname() ?? '/supersudo';
  const router = useRouter();

  useEffect(() => {
    const cancelIdle = warmAdminRoutePrefetches(router, pathname);
    return cancelIdle;
  }, [pathname, router]);

  return null;
}

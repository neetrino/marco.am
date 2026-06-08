'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { warmAdminPageCacheForPath } from '@/lib/admin/admin-page-warm';
import { prefetchAdminRoute, prefetchAllAdminRoutes } from '@/lib/admin/admin-route-prefetch';

type AdminNavContextValue = {
  effectivePath: string;
  beginAdminNavigation: (href: string) => void;
  prefetchAdminNavigation: (href: string) => void;
};

const AdminNavContext = createContext<AdminNavContextValue | null>(null);

function normalizeAdminPath(href: string): string {
  return href.split('?')[0] ?? href;
}

const OPTIMISTIC_NAV_TIMEOUT_MS = 4_000;

export function AdminNavProvider({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '/supersudo';
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const optimisticTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  const clearOptimisticTimeout = useCallback(() => {
    if (optimisticTimeoutRef.current !== null) {
      globalThis.clearTimeout(optimisticTimeoutRef.current);
      optimisticTimeoutRef.current = null;
    }
  }, []);

  useLayoutEffect(() => {
    prefetchAllAdminRoutes(router, pathname);
  }, [pathname, router]);

  useEffect(() => {
    if (!optimisticPath) {
      return;
    }
    const target = normalizeAdminPath(optimisticPath);
    if (pathname === target || pathname.startsWith(`${target}/`)) {
      clearOptimisticTimeout();
      setOptimisticPath(null);
    }
  }, [clearOptimisticTimeout, optimisticPath, pathname]);

  useEffect(() => clearOptimisticTimeout, [clearOptimisticTimeout]);

  const prefetchAdminNavigation = useCallback(
    (href: string) => {
      const path = normalizeAdminPath(href);
      prefetchAdminRoute(router, path);
      warmAdminPageCacheForPath(path);
    },
    [router],
  );

  const beginAdminNavigation = useCallback(
    (href: string) => {
      const path = normalizeAdminPath(href);
      setOptimisticPath(path);
      prefetchAdminNavigation(href);
      clearOptimisticTimeout();
      optimisticTimeoutRef.current = globalThis.setTimeout(() => {
        setOptimisticPath(null);
      }, OPTIMISTIC_NAV_TIMEOUT_MS);
    },
    [clearOptimisticTimeout, prefetchAdminNavigation],
  );

  const value = useMemo(
    (): AdminNavContextValue => ({
      effectivePath: optimisticPath ?? pathname,
      beginAdminNavigation,
      prefetchAdminNavigation,
    }),
    [beginAdminNavigation, optimisticPath, pathname, prefetchAdminNavigation],
  );

  return <AdminNavContext.Provider value={value}>{children}</AdminNavContext.Provider>;
}

export function useAdminNav(): AdminNavContextValue {
  const context = useContext(AdminNavContext);
  if (!context) {
    throw new Error('useAdminNav must be used within AdminNavProvider');
  }
  return context;
}

'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';

const pulse = 'animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700';

/** Main-column placeholder while auth resolves — sidebar stays mounted in AdminShell. */
export function AdminMainSkeleton() {
  const { t } = useTranslation();

  return (
    <div aria-busy="true" aria-label={t('admin.common.loading')}>
      <header className="mb-5 sm:mb-7">
        <div className={`mb-3 h-8 w-48 ${pulse}`} />
        <div className={`h-4 w-72 max-w-full ${pulse}`} />
      </header>
      <div className="space-y-4 pb-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className={`h-24 ${pulse}`} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={`min-h-[220px] ${pulse}`} />
          <div className={`min-h-[220px] ${pulse}`} />
        </div>
      </div>
    </div>
  );
}

type AdminAccessGateProps = {
  readonly children: ReactNode;
};

/**
 * Central admin auth guard — sidebar shell persists in AdminShell; only main column swaps.
 */
export function AdminAccessGate({ children }: AdminAccessGateProps) {
  const { isLoggedIn, isAdmin, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isLoading, isLoggedIn, router]);

  if (isLoading && user === null) {
    return <AdminMainSkeleton />;
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return children;
}

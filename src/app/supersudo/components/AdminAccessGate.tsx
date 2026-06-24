'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';

/**
 * Neutral full-page loader shown while auth resolves — gate wraps the whole admin
 * shell, so no admin chrome (sidebar/menu) is rendered until access is confirmed.
 */
function AdminAccessLoader() {
  const { t } = useTranslation();

  return (
    <div
      aria-busy="true"
      aria-label={t('admin.common.loading')}
      className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-700 dark:border-t-slate-300" />
    </div>
  );
}

type AdminAccessGateProps = {
  readonly children: ReactNode;
};

/**
 * Client-side admin guard — no admin chrome until session confirms admin role.
 * Edge proxy also blocks non-admins before HTML is served.
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
    return <AdminAccessLoader />;
  }

  if (!isLoggedIn || !isAdmin) {
    return <AdminAccessLoader />;
  }

  return children;
}

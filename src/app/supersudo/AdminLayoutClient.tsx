'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { registerAdminTranslations } from '@/lib/i18n';
import { AdminThemeGuard } from './AdminThemeGuard';
import { AdminAccessGate } from './components/AdminAccessGate';
import { AdminRoutePrefetch } from './components/AdminRoutePrefetch';
import { AdminShell } from './components/AdminShell';

type AdminLayoutClientProps = {
  readonly children: ReactNode;
};

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  useEffect(() => {
    void import('@/lib/i18n/admin-translations').then(({ adminTranslations }) => {
      registerAdminTranslations(adminTranslations);
    });
  }, []);

  return (
    <>
      <AdminThemeGuard />
      <AdminShell>
        <AdminAccessGate>
          <AdminRoutePrefetch />
          {children}
        </AdminAccessGate>
      </AdminShell>
    </>
  );
}

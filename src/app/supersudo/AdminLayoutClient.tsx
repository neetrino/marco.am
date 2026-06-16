'use client';

import type { ReactNode } from 'react';

import { adminTranslations } from '@/lib/i18n/admin-translations';
import { registerAdminTranslations } from '@/lib/i18n';
import { AdminThemeGuard } from './AdminThemeGuard';
import { AdminAccessGate } from './components/AdminAccessGate';
import { AdminRoutePrefetch } from './components/AdminRoutePrefetch';
import { AdminShell } from './components/AdminShell';

/** Register before first admin render — async useEffect caused raw i18n keys in the sidebar. */
registerAdminTranslations(adminTranslations);

type AdminLayoutClientProps = {
  readonly children: ReactNode;
};

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
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

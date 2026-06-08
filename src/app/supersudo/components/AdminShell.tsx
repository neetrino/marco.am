'use client';

import type { ReactNode } from 'react';

import { useTranslation } from '@/lib/i18n-client';

import { AdminNavProvider, useAdminNav } from './AdminNavProvider';
import { AdminSidebar } from './AdminSidebar';

type AdminShellProps = {
  readonly children: ReactNode;
};

function AdminShellFrame({ children }: AdminShellProps) {
  const { effectivePath } = useAdminNav();
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <div className="page-shell admin-page-shell admin-shell">
        <div className="admin-layout">
          <AdminSidebar currentPath={effectivePath} t={t} />
          <div className="admin-main">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Persistent admin chrome — sidebar stays mounted across client navigations. */
export function AdminShell({ children }: AdminShellProps) {
  return (
    <AdminNavProvider>
      <AdminShellFrame>{children}</AdminShellFrame>
    </AdminNavProvider>
  );
}

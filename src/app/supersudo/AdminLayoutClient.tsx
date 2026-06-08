'use client';

import type { ReactNode } from 'react';

import { AdminThemeGuard } from './AdminThemeGuard';
import { AdminAccessGate } from './components/AdminAccessGate';
import { AdminRoutePrefetch } from './components/AdminRoutePrefetch';
import { AdminShell } from './components/AdminShell';

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

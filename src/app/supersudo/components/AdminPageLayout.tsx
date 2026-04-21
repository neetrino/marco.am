'use client';

import type { ReactNode } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { AdminSidebar } from './AdminSidebar';

interface AdminPageLayoutProps {
  currentPath: string;
  router: AppRouterInstance;
  t: (key: string) => string;
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack?: () => void;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function AdminPageLayout({
  currentPath,
  router,
  t,
  children,
}: AdminPageLayoutProps) {
  return (
    <div className="admin-page">
      <div className="page-shell admin-shell">
        <div className="admin-layout">
          <AdminSidebar currentPath={currentPath} router={router} t={t} />
          <div className="admin-main">{children}</div>
        </div>
      </div>
    </div>
  );
}

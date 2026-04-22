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
  title,
  subtitle,
  backLabel,
  onBack,
  headerActions,
  children,
}: AdminPageLayoutProps) {
  return (
    <div className="admin-page">
      <div className="page-shell admin-page-shell admin-shell">
        <div className="admin-layout">
          <AdminSidebar currentPath={currentPath} router={router} t={t} />
          <div className="admin-main">
            <header className="mb-5 sm:mb-7">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="admin-back-link"
                  aria-label={backLabel ?? t('admin.common.backToAdmin')}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {backLabel ?? t('admin.common.backToAdmin')}
                </button>
              )}

              <div className="mt-0.5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <h1 className="admin-title">{title}</h1>
                  {subtitle && <p className="admin-subtitle mt-1">{subtitle}</p>}
                </div>
                {headerActions && <div className="shrink-0 sm:pt-0.5">{headerActions}</div>}
              </div>
            </header>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

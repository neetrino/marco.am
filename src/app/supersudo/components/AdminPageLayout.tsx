'use client';

import type { ReactNode } from 'react';

interface AdminPageLayoutProps {
  /** @deprecated Shell is provided by AdminShell in layout — kept for call-site compatibility. */
  currentPath?: string;
  /** @deprecated No longer used — kept for call-site compatibility. */
  router?: unknown;
  /** @deprecated No longer used — kept for call-site compatibility. */
  t?: (key: string) => string;
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

/** Page header + content — outer shell and sidebar live in AdminShell. */
export function AdminPageLayout({
  title,
  subtitle,
  headerActions,
  children,
}: AdminPageLayoutProps) {
  return (
    <>
      <header className="mb-5 sm:mb-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="admin-title">{title}</h1>
            {subtitle && <p className="admin-subtitle mt-1">{subtitle}</p>}
          </div>
          {headerActions && <div className="shrink-0 sm:pt-0.5">{headerActions}</div>}
        </div>
      </header>
      {children}
    </>
  );
}

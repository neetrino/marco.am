'use client';

import type { ReactNode } from 'react';

interface FormSectionProps {
  title?: string;
  header?: ReactNode;
  description?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  header,
  description,
  headerRight,
  children,
  className = '',
}: FormSectionProps) {
  const hasHeaderRow = Boolean(header || title || headerRight);

  return (
    <section className={`border-b border-slate-200/70 pb-6 last:border-b-0 ${className}`.trim()}>
      {hasHeaderRow ? (
        <div
          className={
            headerRight
              ? 'mb-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'
              : 'mb-0'
          }
        >
          {header ? (
            <div className="shrink-0">{header}</div>
          ) : title ? (
            <div className="min-w-0">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
              {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
            </div>
          ) : null}
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
      ) : null}
      {hasHeaderRow ? <div className="pt-3">{children}</div> : children}
    </section>
  );
}

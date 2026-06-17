'use client';

import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, headerRight, children, className = '' }: FormSectionProps) {
  return (
    <section className={`border-b border-slate-200/70 pb-6 last:border-b-0 ${className}`.trim()}>
      <div
        className={
          headerRight
            ? 'mb-0 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'
            : 'mb-4'
        }
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>
      {headerRight ? <div className="pt-4">{children}</div> : children}
    </section>
  );
}

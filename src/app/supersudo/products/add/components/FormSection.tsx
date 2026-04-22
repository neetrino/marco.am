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
    <section
      className={`rounded-2xl border border-marco-border/70 bg-gradient-to-br from-white via-white to-marco-gray/15 p-5 shadow-sm sm:p-6 ${className}`.trim()}
    >
      <div
        className={
          headerRight
            ? 'mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4'
            : 'mb-4 sm:mb-5'
        }
      >
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-marco-black sm:text-xl">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-relaxed text-marco-text/70">{description}</p> : null}
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>
      {children}
    </section>
  );
}

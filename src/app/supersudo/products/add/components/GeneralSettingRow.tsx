'use client';

import type { ReactNode } from 'react';

interface GeneralSettingRowProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

/** Compact label + control row for the General tab. */
export function GeneralSettingRow({ label, hint, children }: GeneralSettingRowProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-marco-black">{label}</p>
        {hint ? <p className="mt-0.5 text-xs leading-snug text-slate-500">{hint}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

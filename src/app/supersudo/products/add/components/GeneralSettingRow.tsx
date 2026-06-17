'use client';

import type { ReactNode } from 'react';

interface GeneralSettingRowProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

/** Label + control row for the General tab settings card. */
export function GeneralSettingRow({ label, hint, children }: GeneralSettingRowProps) {
  return (
    <div className="border-b border-slate-200/70 px-4 py-4 last:border-b-0 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-marco-black">{label}</p>
          {hint ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

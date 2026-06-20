'use client';

import type { ReactNode } from 'react';

interface AdminVerticalTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

interface AdminVerticalTabsProps<T extends string> {
  tabs: AdminVerticalTabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  ariaLabel: string;
}

export function AdminVerticalTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel,
}: AdminVerticalTabsProps<T>) {
  return (
    <nav
      aria-label={ariaLabel}
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200/80 px-3 py-2 md:w-44 md:flex-col md:overflow-x-visible md:border-b-0 md:border-r md:px-2 md:py-4"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors md:w-full md:text-sm ${
              isActive
                ? 'bg-marco-yellow text-marco-black shadow-sm ring-1 ring-marco-yellow/70'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

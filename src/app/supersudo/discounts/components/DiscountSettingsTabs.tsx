'use client';

import { useTranslation } from '../../../../lib/i18n-client';

export type DiscountSettingsTabId = 'global' | 'category' | 'brand' | 'product';

const TAB_IDS: DiscountSettingsTabId[] = ['global', 'category', 'brand', 'product'];

interface DiscountSettingsTabsProps {
  activeTab: DiscountSettingsTabId;
  onTabChange: (tab: DiscountSettingsTabId) => void;
}

export function DiscountSettingsTabs({ activeTab, onTabChange }: DiscountSettingsTabsProps) {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t('admin.discounts.tabsLabel')}
      className="flex gap-1 overflow-x-auto rounded-xl border-2 border-slate-200 bg-slate-100 p-1.5 shadow-inner"
    >
      {TAB_IDS.map((tabId) => {
        const isActive = activeTab === tabId;
        return (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`discount-settings-panel-${tabId}`}
            id={`discount-settings-tab-${tabId}`}
            onClick={() => onTabChange(tabId)}
            className={`min-w-0 shrink-0 flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-bold transition-all sm:px-4 sm:py-3 ${
              isActive
                ? 'bg-marco-yellow text-marco-black shadow-md ring-1 ring-marco-yellow/70'
                : 'bg-transparent text-slate-500 hover:bg-white/90 hover:text-slate-800'
            }`}
          >
            {t(`admin.discounts.tabs.${tabId}`)}
          </button>
        );
      })}
    </div>
  );
}

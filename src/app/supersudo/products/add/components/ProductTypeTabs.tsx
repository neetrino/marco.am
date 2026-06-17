'use client';

import { useTranslation } from '../../../../../lib/i18n-client';

interface ProductTypeTabsProps {
  productType: 'simple' | 'variable';
  onChange: (type: 'simple' | 'variable') => void;
}

export function ProductTypeTabs({ productType, onChange }: ProductTypeTabsProps) {
  const { t } = useTranslation();

  const tabs: Array<{ id: 'simple' | 'variable'; label: string }> = [
    { id: 'simple', label: t('admin.products.add.productTypeSimple') },
    { id: 'variable', label: t('admin.products.add.productTypeVariable') },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t('admin.products.add.productType')}
      </p>
      <div
        role="tablist"
        aria-label={t('admin.products.add.productType')}
        className="flex w-full rounded-xl border-2 border-slate-200 bg-slate-100 p-1.5 shadow-inner"
      >
        {tabs.map((tab) => {
          const isActive = productType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`min-w-0 flex-1 rounded-lg px-4 py-3 text-center text-sm font-bold transition-all sm:text-base ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md ring-1 ring-slate-900/10'
                  : 'bg-transparent text-slate-500 hover:bg-white/90 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useTranslation } from '../../../../../lib/i18n-client';

interface ProductTypeTabsProps {
  productType: 'simple' | 'variable';
  onChange: (type: 'simple' | 'variable') => void;
  variant?: 'section';
}

export function ProductTypeTabs({ productType, onChange, variant }: ProductTypeTabsProps) {
  const { t } = useTranslation();

  const tabs: Array<{ id: 'simple' | 'variable'; label: string }> = [
    { id: 'simple', label: t('admin.products.add.productTypeSimple') },
    { id: 'variable', label: t('admin.products.add.productTypeVariable') },
  ];

  if (variant === 'section') {
    return (
      <div
        role="tablist"
        aria-label={t('admin.products.add.productType')}
        className="inline-flex gap-1"
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
              className={`min-w-[6.5rem] rounded-t-lg px-5 py-2 text-sm font-semibold transition-colors sm:min-w-[7.5rem] sm:px-6 ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={t('admin.products.add.productType')}
      className="inline-flex rounded-xl bg-slate-100 p-1.5"
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
            className={`min-w-[7.5rem] rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors sm:min-w-[8.5rem] sm:text-base ${
              isActive
                ? 'bg-white text-marco-black shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-500 hover:text-marco-black'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

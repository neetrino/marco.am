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
    <div
      role="tablist"
      aria-label={t('admin.products.add.productType')}
      className="inline-flex rounded-xl border border-marco-border/70 bg-marco-gray/20 p-1"
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
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white text-marco-black shadow-sm'
                : 'text-marco-text/70 hover:text-marco-black'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

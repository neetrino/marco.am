'use client';

import { useTranslation } from '@/lib/i18n-client';
import type { ProductClass } from '@/lib/constants/product-class';

interface ProductClassToggleProps {
  productClass: ProductClass;
  onChange: (productClass: ProductClass) => void;
}

/** Compact retail / wholesale switch for section headers. */
export function ProductClassToggle({ productClass, onChange }: ProductClassToggleProps) {
  const { t } = useTranslation();

  const options: Array<{ id: ProductClass; label: string }> = [
    { id: 'retail', label: t('admin.products.add.productClassRetail') },
    { id: 'wholesale', label: t('admin.products.add.productClassWholesale') },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t('admin.products.add.productClassLabel')}
      className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
    >
      {options.map((option) => {
        const isActive = productClass === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.id)}
            className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-marco-yellow text-marco-black shadow-sm ring-1 ring-marco-yellow/70'
                : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

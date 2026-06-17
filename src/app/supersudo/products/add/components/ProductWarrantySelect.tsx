'use client';

import { useTranslation } from '@/lib/i18n-client';
import { PRODUCT_WARRANTY_YEAR_OPTIONS, type ProductWarrantyYears } from '@/lib/constants/product-warranty';

type WarrantySelection = ProductWarrantyYears | null;

interface ProductWarrantySelectProps {
  warrantyYears: WarrantySelection;
  onChange: (years: WarrantySelection) => void;
}

const OPTION_LABEL_KEYS: Record<'none' | ProductWarrantyYears, string> = {
  none: 'admin.products.add.productWarrantyNone',
  1: 'admin.products.add.productWarrantyOneYear',
  2: 'admin.products.add.productWarrantyTwoYears',
  3: 'admin.products.add.productWarrantyThreeYears',
};

/** Compact warranty dropdown for the product editor header row. */
export function ProductWarrantySelect({ warrantyYears, onChange }: ProductWarrantySelectProps) {
  const { t } = useTranslation();
  const selectedValue = warrantyYears === null ? 'none' : String(warrantyYears);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <label
        htmlFor="product-warranty-years"
        className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400"
      >
        {t('admin.products.add.productWarranty')}
      </label>
      <select
        id="product-warranty-years"
        value={selectedValue}
        onChange={(event) => {
          const next = event.target.value;
          if (next === 'none') {
            onChange(null);
            return;
          }
          const parsed = Number.parseInt(next, 10);
          if (PRODUCT_WARRANTY_YEAR_OPTIONS.includes(parsed as ProductWarrantyYears)) {
            onChange(parsed as ProductWarrantyYears);
          }
        }}
        className="min-w-[8.5rem] max-w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-marco-black focus:border-marco-yellow focus:outline-none focus:ring-2 focus:ring-marco-yellow/30"
      >
        <option value="none">{t(OPTION_LABEL_KEYS.none)}</option>
        {PRODUCT_WARRANTY_YEAR_OPTIONS.map((years) => (
          <option key={years} value={String(years)}>
            {t(OPTION_LABEL_KEYS[years])}
          </option>
        ))}
      </select>
    </div>
  );
}

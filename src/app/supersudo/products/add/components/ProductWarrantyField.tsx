'use client';

import { useTranslation } from '@/lib/i18n-client';
import { PRODUCT_WARRANTY_YEAR_OPTIONS, type ProductWarrantyYears } from '@/lib/constants/product-warranty';
import { FormSection } from './FormSection';

type WarrantySelection = ProductWarrantyYears | null;

interface ProductWarrantyFieldProps {
  warrantyYears: WarrantySelection;
  onChange: (years: WarrantySelection) => void;
}

const OPTION_LABEL_KEYS: Record<'none' | ProductWarrantyYears, string> = {
  none: 'admin.products.add.productWarrantyNone',
  1: 'admin.products.add.productWarrantyOneYear',
  2: 'admin.products.add.productWarrantyTwoYears',
  3: 'admin.products.add.productWarrantyThreeYears',
};

export function ProductWarrantyField({ warrantyYears, onChange }: ProductWarrantyFieldProps) {
  const { t } = useTranslation();
  const selectedValue = warrantyYears === null ? 'none' : String(warrantyYears);

  return (
    <FormSection
      title={t('admin.products.add.productWarranty')}
      description={t('admin.products.add.productWarrantyHint')}
    >
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
        className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-marco-yellow focus:outline-none focus:ring-2 focus:ring-marco-yellow/30"
      >
        <option value="none">{t(OPTION_LABEL_KEYS.none)}</option>
        {PRODUCT_WARRANTY_YEAR_OPTIONS.map((years) => (
          <option key={years} value={String(years)}>
            {t(OPTION_LABEL_KEYS[years])}
          </option>
        ))}
      </select>
    </FormSection>
  );
}

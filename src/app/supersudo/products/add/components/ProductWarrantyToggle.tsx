'use client';

import { useTranslation } from '@/lib/i18n-client';
import { PRODUCT_WARRANTY_YEAR_OPTIONS, type ProductWarrantyYears } from '@/lib/constants/product-warranty';
import { SegmentedControl } from './SegmentedControl';

type WarrantySelection = ProductWarrantyYears | null;
type WarrantyOptionId = 'none' | `${ProductWarrantyYears}`;

interface ProductWarrantyToggleProps {
  warrantyYears: WarrantySelection;
  onChange: (years: WarrantySelection) => void;
}

const OPTION_LABEL_KEYS: Record<WarrantyOptionId, string> = {
  none: 'admin.products.add.productWarrantyNone',
  1: 'admin.products.add.productWarrantyOneYear',
  2: 'admin.products.add.productWarrantyTwoYears',
  3: 'admin.products.add.productWarrantyThreeYears',
};

export function ProductWarrantyToggle({ warrantyYears, onChange }: ProductWarrantyToggleProps) {
  const { t } = useTranslation();
  const selectedValue: WarrantyOptionId = warrantyYears === null ? 'none' : String(warrantyYears) as WarrantyOptionId;

  const options: Array<{ id: WarrantyOptionId; label: string }> = [
    { id: 'none', label: t(OPTION_LABEL_KEYS.none) },
    ...PRODUCT_WARRANTY_YEAR_OPTIONS.map((years) => ({
      id: String(years) as WarrantyOptionId,
      label: t(OPTION_LABEL_KEYS[years]),
    })),
  ];

  return (
    <SegmentedControl
      value={selectedValue}
      options={options}
      onChange={(next) => {
        if (next === 'none') {
          onChange(null);
          return;
        }
        const parsed = Number.parseInt(next, 10);
        if (PRODUCT_WARRANTY_YEAR_OPTIONS.includes(parsed as ProductWarrantyYears)) {
          onChange(parsed as ProductWarrantyYears);
        }
      }}
      ariaLabel={t('admin.products.add.productWarranty')}
      columnsClass="grid-cols-2 sm:grid-cols-4"
      size="compact"
    />
  );
}

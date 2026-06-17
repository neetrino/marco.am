'use client';

import type { ProductClass } from '@/lib/constants/product-class';
import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductLabel } from '../types';
import { GeneralSettingRow } from './GeneralSettingRow';
import { ProductClassToggle } from './ProductClassToggle';
import { ProductLabels } from './ProductLabels';
import { ProductWarrantyToggle } from './ProductWarrantyToggle';

interface ProductGeneralTabProps {
  productClass: ProductClass;
  warrantyYears: ProductWarrantyYears | null;
  labels: ProductLabel[];
  onProductClassChange: (productClass: ProductClass) => void;
  onWarrantyYearsChange: (years: ProductWarrantyYears | null) => void;
  onAddLabel: () => void;
  onRemoveLabel: (index: number) => void;
  onUpdateLabel: (
    index: number,
    field: keyof ProductLabel,
    value: ProductLabel[keyof ProductLabel],
  ) => void;
}

export function ProductGeneralTab({
  productClass,
  warrantyYears,
  labels,
  onProductClassChange,
  onWarrantyYearsChange,
  onAddLabel,
  onRemoveLabel,
  onUpdateLabel,
}: ProductGeneralTabProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <GeneralSettingRow
          label={t('admin.products.add.productClassLabel')}
          hint={t('admin.products.add.productClassHint')}
        >
          <ProductClassToggle productClass={productClass} onChange={onProductClassChange} />
        </GeneralSettingRow>

        <GeneralSettingRow
          label={t('admin.products.add.productWarranty')}
          hint={t('admin.products.add.productWarrantyHint')}
        >
          <ProductWarrantyToggle warrantyYears={warrantyYears} onChange={onWarrantyYearsChange} />
        </GeneralSettingRow>
      </div>

      <ProductLabels
        labels={labels}
        onAddLabel={onAddLabel}
        onRemoveLabel={onRemoveLabel}
        onUpdateLabel={onUpdateLabel}
      />
    </div>
  );
}

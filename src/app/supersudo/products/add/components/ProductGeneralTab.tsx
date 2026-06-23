'use client';

import type { ProductClass } from '@/lib/constants/product-class';
import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductLabel } from '../types';
import { GeneralSettingRow } from './GeneralSettingRow';
import { ProductClassToggle } from './ProductClassToggle';
import { ProductLabels } from './ProductLabels';
import { ProductDiscountSection } from './ProductDiscountSection';
import { ProductWarrantyToggle } from './ProductWarrantyToggle';

interface ProductGeneralTabProps {
  productId?: string | null;
  isEditMode?: boolean;
  discountPercent?: number;
  discountExpiresAt?: string | null;
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

function GeneralSettingsDivider() {
  return (
    <>
      <div
        className="mx-4 h-px shrink-0 bg-gradient-to-r from-transparent via-slate-200/90 to-transparent lg:hidden"
        aria-hidden
      />
      <div
        className="hidden w-8 shrink-0 items-stretch justify-center py-3 lg:flex"
        aria-hidden
      >
        <div className="w-px bg-gradient-to-b from-transparent via-slate-300/70 to-transparent" />
      </div>
    </>
  );
}

export function ProductGeneralTab({
  productId = null,
  isEditMode = false,
  discountPercent = 0,
  discountExpiresAt = null,
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div className="flex shrink-0 flex-col lg:flex-row">
        <div className="min-w-0 flex-1 px-4 py-3 lg:px-5 lg:py-4">
          <GeneralSettingRow
            label={t('admin.products.add.productClassLabel')}
            hint={t('admin.products.add.productClassHint')}
          >
            <ProductClassToggle productClass={productClass} onChange={onProductClassChange} />
          </GeneralSettingRow>
        </div>

        <GeneralSettingsDivider />

        <div className="min-w-0 flex-1 px-4 py-3 lg:px-5 lg:py-4">
          <GeneralSettingRow
            label={t('admin.products.add.productWarranty')}
            hint={t('admin.products.add.productWarrantyHint')}
          >
            <ProductWarrantyToggle warrantyYears={warrantyYears} onChange={onWarrantyYearsChange} />
          </GeneralSettingRow>
        </div>
      </div>

      <div
        className="mx-4 h-px shrink-0 bg-gradient-to-r from-transparent via-slate-200/90 to-transparent lg:mx-5"
        aria-hidden
      />

      {isEditMode && productId ? (
        <div className="px-4 py-3 lg:px-5">
          <ProductDiscountSection
            productId={productId}
            initialDiscountPercent={discountPercent}
            initialDiscountExpiresAt={discountExpiresAt}
          />
        </div>
      ) : null}

      <div
        className="mx-4 h-px shrink-0 bg-gradient-to-r from-transparent via-slate-200/90 to-transparent lg:mx-5"
        aria-hidden
      />

      <ProductLabels
        labels={labels}
        onAddLabel={onAddLabel}
        onRemoveLabel={onRemoveLabel}
        onUpdateLabel={onUpdateLabel}
      />
    </div>
  );
}

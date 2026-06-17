'use client';

import type { ProductClass } from '@/lib/constants/product-class';
import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';
import type { ProductLabel } from '../types';
import { ProductClassToggle } from './ProductClassToggle';
import { ProductLabels } from './ProductLabels';
import { ProductWarrantySelect } from './ProductWarrantySelect';

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
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ProductWarrantySelect warrantyYears={warrantyYears} onChange={onWarrantyYearsChange} />
        <ProductClassToggle productClass={productClass} onChange={onProductClassChange} />
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

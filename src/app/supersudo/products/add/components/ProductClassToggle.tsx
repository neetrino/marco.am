'use client';

import { useTranslation } from '@/lib/i18n-client';
import type { ProductClass } from '@/lib/constants/product-class';
import { SegmentedControl } from './SegmentedControl';

interface ProductClassToggleProps {
  productClass: ProductClass;
  onChange: (productClass: ProductClass) => void;
}

export function ProductClassToggle({ productClass, onChange }: ProductClassToggleProps) {
  const { t } = useTranslation();

  const options: Array<{ id: ProductClass; label: string }> = [
    { id: 'retail', label: t('admin.products.add.productClassRetail') },
    { id: 'wholesale', label: t('admin.products.add.productClassWholesale') },
  ];

  return (
    <SegmentedControl
      value={productClass}
      options={options}
      onChange={onChange}
      ariaLabel={t('admin.products.add.productClassLabel')}
      columnsClass="grid-cols-2"
    />
  );
}

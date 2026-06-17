'use client';

import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductClass } from '@/lib/constants/product-class';
import { FormSection } from './FormSection';

interface PublishingProps {
  productClass: ProductClass;
  onProductClassChange: (productClass: ProductClass) => void;
}

export function Publishing({ productClass, onProductClassChange }: PublishingProps) {
  const { t } = useTranslation();

  return (
    <FormSection title={t('admin.products.add.publishing')}>
      <div className="space-y-2">
        <label htmlFor="productClass" className="block text-sm font-medium text-gray-700">
          {t('admin.products.add.productClassLabel')}
        </label>
        <select
          id="productClass"
          value={productClass}
          onChange={(event) => onProductClassChange(event.target.value as ProductClass)}
          className="admin-field w-full text-sm"
        >
          <option value="retail">{t('admin.products.add.productClassRetail')}</option>
          <option value="wholesale">{t('admin.products.add.productClassWholesale')}</option>
        </select>
      </div>
    </FormSection>
  );
}

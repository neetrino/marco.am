'use client';

import type { ProductClass } from '@/lib/constants/product-class';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductDescriptionEntry } from '../../../../../lib/products/product-description';
import { FormSection } from './FormSection';
import { ProductClassToggle } from './ProductClassToggle';
import { ProductDescriptionFields } from './ProductDescriptionFields';

interface BasicInformationProps {
  description: ProductDescriptionEntry[];
  productClass: ProductClass;
  onDescriptionChange: (entries: ProductDescriptionEntry[]) => void;
  onProductClassChange: (productClass: ProductClass) => void;
}

export function BasicInformation({
  description,
  productClass,
  onDescriptionChange,
  onProductClassChange,
}: BasicInformationProps) {
  const { t } = useTranslation();

  return (
    <FormSection
      header={
        <ProductClassToggle productClass={productClass} onChange={onProductClassChange} />
      }
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('admin.products.add.description')}
        </label>
        <ProductDescriptionFields entries={description} onChange={onDescriptionChange} />
      </div>
    </FormSection>
  );
}

'use client';

import type { ProductClass } from '@/lib/constants/product-class';
import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductDescriptionEntry } from '../../../../../lib/products/product-description';
import { FormSection } from './FormSection';
import { ProductClassToggle } from './ProductClassToggle';
import { ProductDescriptionFields } from './ProductDescriptionFields';
import { ProductWarrantySelect } from './ProductWarrantySelect';

interface BasicInformationProps {
  description: ProductDescriptionEntry[];
  productClass: ProductClass;
  warrantyYears: ProductWarrantyYears | null;
  onDescriptionChange: (entries: ProductDescriptionEntry[]) => void;
  onProductClassChange: (productClass: ProductClass) => void;
  onWarrantyYearsChange: (years: ProductWarrantyYears | null) => void;
}

export function BasicInformation({
  description,
  productClass,
  warrantyYears,
  onDescriptionChange,
  onProductClassChange,
  onWarrantyYearsChange,
}: BasicInformationProps) {
  const { t } = useTranslation();

  return (
    <FormSection
      header={
        <ProductWarrantySelect warrantyYears={warrantyYears} onChange={onWarrantyYearsChange} />
      }
      headerRight={
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

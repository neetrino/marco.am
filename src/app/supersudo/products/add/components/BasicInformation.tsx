'use client';

import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductDescriptionEntry } from '../../../../../lib/products/product-description';
import { FormSection } from './FormSection';
import { ProductDescriptionFields } from './ProductDescriptionFields';

interface BasicInformationProps {
  description: ProductDescriptionEntry[];
  onDescriptionChange: (entries: ProductDescriptionEntry[]) => void;
}

export function BasicInformation({ description, onDescriptionChange }: BasicInformationProps) {
  const { t } = useTranslation();

  return (
    <FormSection title={t('admin.products.add.basicInformation')}>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('admin.products.add.description')}
        </label>
        <ProductDescriptionFields entries={description} onChange={onDescriptionChange} />
      </div>
    </FormSection>
  );
}
